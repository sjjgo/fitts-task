"use strict";

/**
 * Create dimensions from the given values and store them for later use.
 * All values should be positive and make sense.
 * @param {number} width The outer width of the area.
 * @param {number} height The outer height of the area.
 * @param {number} top Margin form the top edge.
 * @param {number} right Margin form the right edge.
 * @param {number} bottom Margin form the bottom edge.
 * @param {number} left Margin form the left edge.
 */
function makeDimension(width, height, top, right, bottom, left) {
    return {
        width: width,
        height: height,
        innerWidth: width - (left + right),
        innerHeight: height - (top + bottom),
        top: top,
        right: right,
        bottom: bottom,
        left: left,
        cx: (width - (left + right)) / 2 + left,
        cy: (height - (top + bottom)) / 2 + top
    };
}

var user = guid();

var clickcount = 0;
var currentCondition = 0;

// set up dimensions for the plotting.
var testDimension = makeDimension(700, 500, 30, 30, 30, 30);

var LIVE_STAY = 1000;
var MAX_TIME = 2000;
var UPDATE_DELAY = MAX_TIME;
var MAX_SPEED = 1; // pixel/ms

var fittsTest, testAreaSVG, firstData;

var conditions = _.shuffle([{
    width: 35,
    distance: 275,
    type: 'experimental'
}, {
    width: 55,
    distance: 275,
    type: 'experimental'
}, {
    width: 35,
    distance: 325,
    type: 'experimental'
}, {
    width: 55,
    distance: 325,
    type: 'experimental'
}]);
conditions.unshift({
    width: 60,
    distance: 200,
    type: 'training'
});

$(document).ready(function() {
    $('#retry-submit').click(function(evt){
        sendData();    
    });

    doD3Setup();
    fittsTest = FittsTest();
    fittsTest.updateISOCircles();
    fittsTest.addDataSet();
});

function FittsTest() {
    return {
        target: {
            x: 0,
            y: 0,
            r: 10
        },
        start: {
            x: 0,
            y: 0,
            t: 0
        },
        last: {},

        isoPositions: [],
        currentPosition: 0,
        currentCount: 0,
        miss: 0,
        isoLimits: {
            minD: 120,
            maxD: 300,
            minW: 10,
            maxW: 100
        },
        isoParams: {
            num: 9,
            distance: conditions[currentCondition].distance,
            width: conditions[currentCondition].width
        },

        currentPath: [],
        active: false,

        data: [],
        currentDataSet: 0,
        dataCnt: 0,

        colour: d3.scaleOrdinal(d3.schemeCategory10),

        sumID: 0,
        sumTime: 0,

        updateTimeoutHandle: undefined,

        generateTarget: function() {
            this.target = this.isoPositions[this.currentPosition];
            this.target.distance = this.isoParams.distance;
            this.currentPosition = (this.currentPosition + Math.ceil(this.isoPositions.length / 2)) % this.isoPositions.length;

            var target = testAreaSVG.selectAll('#target').data([this.target]);

            var insert = function(d) {
                d.attr('cx', function(d) {
                        return d.x;
                    })
                    .attr('cy', function(d) {
                        return d.y;
                    })
                    .attr('r', function(d) {
                        return d.w / 2;
                    });
            }

            target.enter()
                .append('circle')
                .attr('id', 'target')
                .style('fill', 'red')
                .call(insert);

            target.transition()
                .call(insert);
        },

        updateISOCircles: function() {
            this.currentCount = 0;

            this.generateISOPositions(this.isoParams.num,
                this.isoParams.distance,
                this.isoParams.width);

            var circles = testAreaSVG.selectAll('circle').data(this.isoPositions);

            var insert = function(d) {
                d.attr('cx', function(d) {
                        return d.x;
                    })
                    .attr('cy', function(d) {
                        return d.y;
                    })
                    .attr('r', function(d) {
                        return d.w / 2;
                    });
            }

            circles.enter()
                .append('circle')
                .attr('class', 'iso')
                .call(insert);

            circles.transition()
                .call(insert);

            circles.exit()
                .transition()
                .attr('r', 0)
                .remove();

            this.currentPosition = 0;
            this.generateTarget();
        },

        generateISOPositions: function(num, d, w) {
            this.isoPositions = [];

            for (var i = 0; i < num; i++) {
                this.isoPositions[i] = {
                    x: testDimension.cx + ((d / 2) * Math.cos((2 * Math.PI * i) / num)),
                    y: testDimension.cy + ((d / 2) * Math.sin((2 * Math.PI * i) / num)),
                    w: w
                };
            }
        },

        removeTarget: function() {
            testAreaSVG.selectAll('#target').data([])
                .exit()
                .remove();
            this.currentPath = [];
        },

        mouseClicked: function(x, y) {
            if (distance({
                    x: x,
                    y: y
                }, this.target) < (this.target.w / 2)) {
                this.addDataPoint({
                    start: this.start,
                    target: this.target,
                    path: this.currentPath,
                    hit: {
                        x: x,
                        y: y,
                        t: (new Date).getTime()
                    }
                });
                this.removeTarget();

                this.currentCount++;
                this.generateTarget();

                this.last = {
                    x: x,
                    y: y,
                    t: (new Date).getTime()
                };
                this.start = this.last;
                this.currentPath.push(this.last);
            } else {
                this.miss++;
            }
        },

        mouseMoved: function(x, y) {
            if (this.active) {
                // skip if the mouse did actually not move
                // that should practically never happen...
                if (x == this.last.x && y == this.last.y) {
                    return;
                }

                // set timeout for updating plots
                if (this.updateTimeoutHandle) {
                    window.clearTimeout(this.updateTimeoutHandle);
                }
                this.updateTimeoutHandle = window.setTimeout(this.updatePlots, UPDATE_DELAY, this);


                var newPoint = {
                    x: x,
                    y: y,
                    t: (new Date).getTime()
                }
                this.currentPath.push(newPoint)

                var dt = newPoint.t - this.last.t;
                var dist = distance(this.last, {
                    x: x,
                    y: y
                })
                if (dt > 0)
                    var speed = dist / dt;
                else
                    var speed = 0;

                testAreaSVG.append('line')
                    .attr('class', 'trace')
                    .attr('x1', this.last.x)
                    .attr('x2', newPoint.x)
                    .attr('y1', this.last.y)
                    .attr('y2', newPoint.y)
                    .style('stroke', v(speed))
                    .transition()
                    .duration(5000)
                    .style('stroke-opacity', 0)
                    .remove();
                this.last = newPoint;
            }
        },

        addDataPoint: function(data) {
            // add point to data array for plotting into ID/time scatter plot
            if (this.active == false) {
                this.active = true;
                return;
            }

            var dt = data.hit.t - data.start.t;

            if (dt < MAX_TIME) // skip if obvious outlier
            {
                clickcount += 1;
                var dist = distance(data.target, data.start);
                var id = shannon(dist, data.target.w);

                this.data[this.currentDataSet].data.push({
                    time: dt,
                    distance: data.target.distance,
                    width: data.target.w,
                    type: conditions[currentCondition].type,
                    conditionOrder: currentCondition
                });

                var A = data.start;
                var B = data.target;
                var path = data.path;

                var hit = {}
                var q = project(A, B, data.hit);
                hit.x = distance(q, B) * sign(q.t - 1);
                hit.y = distance(q, data.hit) * isLeft(A, B, data.hit);

                var last = {
                    x: 0,
                    y: 0,
                    t: data.start.t,
                    v: 0
                };
                for (var i = 0; i < path.length; i++) {
                    var p = path[i];

                    var q = project(A, B, p);
                    var x = distance(q, A) * sign(q.t);
                    var y = distance(q, p) * isLeft(A, B, p);

                    var dt = p.t - last.t;
                    var dist = distance(last, {
                        x: x,
                        y: y
                    });
                    if (dt > 0)
                        var speed = dist / dt;
                    else
                        var speed = 0;

                    var last = {}
                    last.x = x;
                    last.y = y;
                    last.t = p.t;
                    last.v = speed;
                }
            }

            if (clickcount === 10) {
                if (currentCondition === conditions.length - 1) {
                    $('.fitts-area').remove();
                    sendData();
                } else {
                    $('.trace').remove();
                    clickcount = 0;
                    currentCondition += 1;
                    this.isoParams.width = conditions[currentCondition].width;
                    this.isoParams.distance = conditions[currentCondition].distance;
                    this.updateISOCircles();
                    this.active = false;
                }
            }
        },

        addDataSet: function() {
            this.dataCnt++;
            var num = this.dataCnt;
            this.data[num] = {
                data: [],
            };
            this.currentDataSet = num
        }
    }
};

function randomAB(a, b) {
    return a + Math.random() * (b - a);
}


/**
 * Project a point q onto the line p0-p1
 * Code taken from: http://www.alecjacobson.com/weblog/?p=1486
 */
function project(A, B, p) {
    var AB = minus(B, A);
    var AB_squared = dot(AB, AB);
    if (AB_squared == 0) {
        return A;
    } else {
        var Ap = minus(p, A);
        var t = dot(Ap, AB) / AB_squared;
        return {
            x: A.x + t * AB.x,
            y: A.y + t * AB.y,
            t: t
        };
    }
}

function mouseMoved() {
    var m = d3.mouse(this);
    fittsTest.mouseMoved(m[0], m[1])
}

function mouseClicked() {
    var m = d3.mouse(this);
    fittsTest.mouseClicked(m[0], m[1]);
}

function dot(a, b) {
    return (a.x * b.x) + (a.y * b.y);
}

// coutesy of http://stackoverflow.com/questions/3461453/determine-which-side-of-a-line-a-point-lies
function isLeft(A, B, p) {
    return ((B.x - A.x) * (p.y - A.y) - (B.y - A.y) * (p.x - A.x)) >= 0 ? 1 : -1;
}

function minus(a, b) {
    if (!a) console.log(a, b);
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function sign(a) {
    return a >= 0 ? 1 : -1;
}

function clampInt(lower, upper, x) {
    return Math.min(upper, Math.max(lower, Math.floor(x)));
}

function shannon(A, W) {
    return Math.log(A / W + 1) / Math.log(2);
}

function bgRect(d, dim) {
    return d.append('rect')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('width', dim.width)
        .attr('height', dim.height)
        .attr('class', 'back');
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function sendData() {
    $('.result').hide();
    $.ajax({
            type: "POST",
            url: "finish.php",
            dataType: 'json',
            data: {
                json: JSON.stringify({
                    participant: user,
                    data: fittsTest.data[fittsTest.currentDataSet].data
                })
            }
        })
        .done(function(data) {
            firstData = data;
            var csvData = '"Participant","Type","RoundNum","Width","Distance","Time"\n';
            $.each(firstData.firstppdata, function(i, line) {
                csvData += '"' + line[0] + '","' + line[1] + '","' + line[2] + '","' + line[3] + '","' + line[4] + '","' + line[5] + '"\n'
            });
            console.log(csvData);
            $('#dl-raw-pp').attr('href', 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csvData));
            $('#complete-area').show();
        })
        .fail(function() {
            $('#incomplete-area').show();
        });
}

function rHit(r, rTarget) {
    return ((plotHitsDimension.innerWidth / 2) / rTarget) * r;
};

function v(v) {
    return 'rgb(0,0,' + clampInt(0, 255, (v / MAX_SPEED) * 255) + ')';
}

function doD3Setup() {
    testAreaSVG = d3.select('#test-area').append('svg')
        .attr('width', testDimension.width)
        .attr('height', testDimension.height)
        .style('pointer-events', 'all')
        .on('mousemove', mouseMoved)
        .on('mousedown', mouseClicked)
        .call(bgRect, testDimension);
}