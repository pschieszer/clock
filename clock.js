const clockSpots = (n) =>
    "".padStart(n)
      .split("")
      .map((x, ndx) => (2 * Math.PI) * (-0.25 + (ndx / n)))
      .map(x => ({ x: Math.cos(x), y: Math.sin(x) }));

const getCurrentSvg = () => document.querySelector("svg#clock");

const drawTextCell = (x, y, id, color, text) => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "text");
	result.setAttributeNS(null, "x", x);
	result.setAttributeNS(null, "y", y);
	result.setAttribute("id", id);
	const currCol = `hsl(${color} 100% 50%)`;
	result.setAttribute("fill", currCol);
	result.setAttribute("stroke", currCol);
  result.appendChild(document.createTextNode(text));
	return result;
};

const radius = 150;
const secondsLength = () => radius * (11/15);
const minutesLength = () => radius * (2/3);
const hoursLength = () => radius * (8/15);

const drawLine = (x, y, id, color) => {
  const result = document.createElementNS("http://www.w3.org/2000/svg", "line");
  result.setAttributeNS(null, "x1", radius);
  result.setAttributeNS(null, "x2", x);
  result.setAttributeNS(null, "y1", radius);
  result.setAttributeNS(null, "y2", y);
  result.setAttributeNS(null, "stroke-width", "3");
  result.setAttributeNS(null, "stroke-linecap", "round");
  result.setAttribute("id", id);
  const currCol = `hsl(${color} 100% 50%)`;
  result.setAttribute("fill", currCol);
  result.setAttribute("stroke", currCol);

  return result;
}

const buildTimes = () => {
  const now = new Date();
  const hour = now.getHours() < 12 ? now.getHours() : now.getHours() % 12;
  const minute = now.getMinutes();
  const seconds = now.getSeconds();
  const hourOffset = Math.floor(minute / 12) + (hour * 5);
  const minuteSpots = clockSpots(60);
  const hourEndpoint = minuteSpots[hourOffset];
  const minuteEndpoint = minuteSpots[minute];
  const secondEndpoint = minuteSpots[now.getSeconds()];
  return { hourEndpoint, hourOffset, minuteEndpoint, minute, secondEndpoint, seconds };
}

const buildSvgTag = () => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const hours = clockSpots(12);
  hours.map((x, ndx) => drawTextCell(x.x * secondsLength() + radius, x.y * secondsLength() + radius, `hour${ndx}`, ndx * 30, `${(ndx > 0) ? ndx : 12}`))
    .forEach(x => result.appendChild(x));

  const { hourEndpoint, minuteEndpoint, secondEndpoint } = buildTimes();
  result.appendChild(drawLine(secondEndpoint.x * secondsLength() + radius, secondEndpoint.y * secondsLength() + radius, `secondHand`, 0));
  result.appendChild(drawLine(minuteEndpoint.x * minutesLength() + radius, minuteEndpoint.y * minutesLength() + radius, `minuteHand`, 240));
  result.appendChild(drawLine(hourEndpoint.x * hoursLength() + radius, hourEndpoint.y * hoursLength() + radius, `hourHand`, 120));
  return result;
}

const updateHands = () => {
  const { hourEndpoint, hourOffset, minuteEndpoint, minute, secondEndpoint, seconds } = buildTimes();
  document.getElementById('hourHand').setAttribute('x2', hourEndpoint.x * hoursLength() + radius);
  document.getElementById('hourHand').setAttribute('y2', hourEndpoint.y * hoursLength() + radius);
  document.getElementById('hourHand').setAttribute('stroke', `hsl(${hourOffset * 6} 100% 50%)`);
  document.getElementById('minuteHand').setAttribute('x2', minuteEndpoint.x * minutesLength() + radius);
  document.getElementById('minuteHand').setAttribute('y2', minuteEndpoint.y * minutesLength() + radius);
  const minuteColor = minute * 6 + Math.floor((hourOffset * 6) % 5);
  document.getElementById('minuteHand').setAttribute('stroke', `hsl(${minuteColor} 100% 50%)`);
  document.getElementById('secondHand').setAttribute('x2', secondEndpoint.x * secondsLength() + radius);
  document.getElementById('secondHand').setAttribute('y2', secondEndpoint.y * secondsLength() + radius);
  const secondColor = seconds * 6 + Math.floor(minuteColor % 5);
  document.getElementById('secondHand').setAttribute('stroke', `hsl(${secondColor} 100% 50%)`);
}

const updateBackground = () => svgTag.style.backgroundColor = `hsl(${((buildTimes().seconds * 6) + 180) % 360} 100% 50%)`;

const buildParms = new URLSearchParams(window.location.search);
const requestable = ['height', 'width', 'wakeLock', 'backgroundColor'];

const getParam = (attrib) => {
	const requested = buildParms.get(attrib);
	return requested;
};

const getNumWithDefault = (param, def) => {
	const found = getParam(param);
	return (found) ? Number(found) : def;
};

const getHeight = () => getNumWithDefault('height', window.innerHeight * .97);

const getWidth = () => getNumWithDefault('width', window.innerWidth * .97);

let wakeLock = undefined;

const handleVisibilityChange = async () => {
	if (document.visibilityState === 'visible') {
		checkWakeLock();
	}
};

const wakeLockSuccess = (lock) => {
	wakeLock = lock;
	wakeLock.addEventListener('release', () => console.log(`wakeLock released: ${wakeLock.released}`));
	document.addEventListener('visibilitychange', handleVisibilityChange);
	console.log(`wakeLock is set`);
};

const wakeLockCatch = (err) => console.error(`Unable to obtain wakeLock: ${err}`);

const checkWakeLock = () =>
	(getParam('wakeLock') !== false &&
	 navigator.wakeLock.request('screen').then(wakeLockSuccess, wakeLockCatch)) ||
	console.log(`wakeLock not requested`);

const adjustTextPosition = (textElement) => {
    const bbox = textElement.getBBox();
    const newX = parseFloat(textElement.getAttribute('x')) - (bbox.width / 2);
    const newY = parseFloat(textElement.getAttribute('y')) + (bbox.height / 4);
    textElement.setAttribute('x', newX);
    textElement.setAttribute('y', newY);
}

const viewHeight = getHeight();
const viewWidth = getWidth();
const svgTag = getCurrentSvg();
svgTag.setAttribute('height', viewHeight);
svgTag.setAttribute('width', viewWidth);
svgTag.appendChild(buildSvgTag());
[...svgTag.getElementsByTagNameNS("http://www.w3.org/2000/svg", "text")].forEach(adjustTextPosition);

const requestedBackgroundColor = getParam('backgroundColor');
if (requestedBackgroundColor) {
  if (requestedBackgroundColor == 'rotate') {
    window.setInterval(updateBackground, 1000, 1000 - new Date().getMilliseconds());
  } else {
    svgTag.style.backgroundColor = requestedBackgroundColor;
  }
}

window.setInterval(updateHands, 1000, 1000 - new Date().getMilliseconds());
checkWakeLock();
