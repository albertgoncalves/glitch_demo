/* global keys     */
/* global keysFlip */
/* global L        */

/* jshint esversion: 6 */
/* jshint -W014 */

const randPoint = (bound) => bound - Math.random() * (bound * 2);

const randCoords = () => [randPoint(75), randPoint(180)];

const randomZoom = () => Math.round(Math.random() * 4) + 4;

// note: arrow notation will define this function as if we were returning the
// value 'map.setView(coords, zoom)' -- won't cause any problems here, but keep
// in mind!
const zoomToCoords = (map, coords, zoom) => map.setView(coords, zoom);

const assignInput = (input) =>
    document.getElementById('keys').innerHTML = input;

const boundsDiff = (map, ax) =>
    map.getBounds()._northEast[ax] - map.getBounds()._southWest[ax];

const boundsCntr = (map, ax) =>
    map.getBounds()._northEast[ax] - (boundsDiff(map, ax) / 2);

const adjustAx = (map, ax, val) => boundsDiff(map, ax) * val;

const randPointInView = (currentBounds) => [randPlacement(map, 'lat'),
                                            randPlacement(map, 'lng')];

// https://www.wrld3d.com/wrld.js/latest/docs/leaflet/L.Circle/
const addPointToMap = (newPoint, circleOpts, newOpacity, text) =>
    L.circle(newPoint, circleOpts)
     .addTo(map)
     .setStyle({fillOpacity: newOpacity, opacity: newOpacity})
     .bindPopup(text);

const moveMarker = (marker, newPoint, newOpacity) =>
    marker.setLatLng(newPoint)
          .setStyle({fillOpacity: newOpacity, opacity: newOpacity});

const getEdges = (map) => ({ northEdge: map.getBounds()._northEast.lat
                           , southEdge: map.getBounds()._southWest.lat
                           , eastEdge:  map.getBounds()._northEast.lng
                           , westEdge:  map.getBounds()._southWest.lng
                           });

const strikeThru = (dirId) =>
    document.getElementById(dirId).style['text-decoration'] = 'line-through';

function randPlacement(map, ax) {
    let withinBounds =
        ((Math.random() - 0.5) * boundsDiff(map, ax)) * Math.random();

    return boundsCntr(map, ax) + withinBounds;
}

function pointOffscreen(map) {
    let { 0: northEdge
        , 1: southEdge
        , 2: eastEdge
        , 3: westEdge
        } = getEdges(map);

    let xNew = randPoint(90);
    let yNew = randPoint(180);

    while ((xNew >= westEdge) & (xNew <= eastEdge)) {
        xNew = randPoint(90);
    }

    while ((yNew >= southEdge) & (yNew <= northEdge)) {
        yNew = randPoint(180);
    }
    return [xNew, yNew];
}

function measureGap(map, markerPos) {
    let {0: latPos, 1: lngPos} = markerPos;

    let latBounds = boundsDiff(map, 'lat');
    let lngBounds = boundsDiff(map, 'lng');
    let latCntr   = boundsCntr(map, 'lat');
    let lngCntr   = boundsCntr(map, 'lng');

    let latRatio  = Math.abs(latPos - latCntr) / (latBounds);
    let lngRatio  = Math.abs(lngPos - lngCntr) / (lngBounds);

    let gapRatio  = ((latRatio + lngRatio) / 2 + 0.3) * 0.85;

    gapRatio      = gapRatio < 0.02 ? 0.02
                                    : gapRatio;

    gapRatio      = gapRatio > 1    ? 1
                                    : gapRatio;

    return gapRatio;
}

function runAway(markerFrom, markerTo) {
    let {0: xFrom, 1: yFrom} = markerFrom;
    let {0: xTo,   1: yTo  } = markerTo;

    let xPath = xTo - xFrom;
    let yPath = yTo - yFrom;

    let xNew = xFrom + (xPath * Math.random() * 0.0005) + 0.0025;
    let yNew = yFrom + (yPath * Math.random() * 0.0005) + 0.0025;

    return [xNew, yNew];
}

const empty       = '';
const tileUrl     = 'https://stamen-tiles.a.ssl.fastly.net/watercolor' +
                    '/{z}/{x}/{y}.jpg';
const tileOptions = { maxZoom:         18
                    };
const mapOptions  = { doubleClickZoom: false
                    , dragging:        false
                    , keyboard:        false
                    , touchZoom:       false
                    , scrollWheelZoom: false
                    , tap:             false
                    , zoomControl:     false
                    };
const circleOpts  = { color:           '#f03'
                    , fillColor:       '#f03'
                    , radius:           50000
                    };

const spdMv       = 50;
const spdAdjDest  = 3000;
var crntWrd       = empty;
var coords        = randCoords();
var zoom          = randomZoom();
var map           = L.map('map', mapOptions).setView(coords, zoom);
var firstUp       = true;
var firstDown     = true;
var firstLeft     = true;
var firstRight    = true;
var firstIn       = true;
var firstOut      = true;
var firstRandom   = true;

// (QUASI) MAIN HERE WE GO

window.onkeydown = function(e) {
    let keyCode  = e.keyCode ? e.keyCode : e.which;
    let key      = keysFlip[keyCode];

    if (key === 'enter') {
        if (crntWrd == 'random') {
            coords = randCoords();
            zoom   = randomZoom();

            if (firstRandom) {
                strikeThru('random');
                firstRandom = false;
            }

        } else if (crntWrd == 'up') {
            let {0: x, 1: y} = coords;
            let newX         = x + adjustAx(map, 'lat', 0.25);
            coords           = [newX > 90 ? 90 : newX, y];

            if (firstUp) {
                strikeThru('up');
                firstUp = false;
            }

        } else if (crntWrd == 'down') {
            let {0: x, 1: y} = coords;
            let newX         = x - adjustAx(map, 'lat', 0.25);
            coords           = [newX < -90 ? -90 : newX, y];

            if (firstDown) {
                strikeThru('down');
                firstDown = false;
            }

        } else if (crntWrd == 'left') {
            let {0: x, 1: y} = coords;
            let newY         = y - adjustAx(map, 'lng', 0.20);
            coords           = [x, newY];

            if (firstLeft) {
                strikeThru('left');
                firstLeft = false;
            }

        } else if (crntWrd == 'right') {
            let {0: x, 1: y} = coords;
            let newY         = y + adjustAx(map, 'lng', 0.20);
            coords           = [x, newY];

            if (firstRight) {
                strikeThru('right');
                firstRight = false;
            }

        } else if (crntWrd == 'in') {
            let newZoom = zoom + 1;
            zoom        = newZoom > tileOptions.maxZoom ? tileOptions.maxZoom
                                                        : newZoom;
            if (firstIn) {
                strikeThru('in');
                firstIn = false;
            }

        } else if (crntWrd == 'out') {
            let newZoom = zoom - 1;
            zoom        = newZoom < 4 ? 4
                                      : newZoom;
            if (firstOut) {
                strikeThru('out');
                firstOut = false;
            }

        } else if (crntWrd == 'reset') {
            location.reload();
        }

        map.setView(coords, zoom);

    } else if (key === 'space') {
        crntWrd += ' ';

    } else if ((crntWrd.length > 20) ||
               (key === 'backspace') ||
               (key === 'delete')    ||
               (key === 'esc')) {
        crntWrd = empty;

    } else if (key.length > 1) {
        // pass

    } else {
        crntWrd += key;
    }

    assignInput(crntWrd);
};

assignInput('Try typing a <span class="underline">word</span>, ' +
            'then press <strong>enter</strong>. ' +
            "If all else fails: " +
            '<strong>delete</strong> or <strong>esc</strong>!');

L.tileLayer(tileUrl, tileOptions).addTo(map);

var markerPos = randPointInView(map.getBounds());
var markerEnd = pointOffscreen(map);
var marker    = addPointToMap( markerPos
                             , circleOpts
                             , measureGap(map, markerPos)
                             , "You'll never catch me!"
                             );

setInterval(
    function() {
        let currentBounds = map.getBounds();
        let newOpacity    = 0.1;
        markerPos         = runAway(markerPos, markerEnd);
        marker            = moveMarker( marker
                                      , markerPos
                                      , measureGap(map, markerPos)
                                      );
    }, spdMv
);

setInterval(
    function() {
        markerEnd = pointOffscreen(map);
    }, spdAdjDest
);
