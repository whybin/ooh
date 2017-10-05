(function (window, document) {
    window.addEventListener('load', function () {
        const poi = [
            { name: 'Architecture and Engineering' },
            { name: 'Arts and Design' },
            { name: 'Building and Grounds Cleaning' },
            { name: 'Business and Financial' },
            { name: 'Community and Social Service' },
            { name: 'Computer and Information Technology' },
            { name: 'Construction and Extraction' },
        ];

        const canvasElem = document.querySelector('#canvas');
        const canvas     = SVG('canvas');
        const map        = new Map(canvas, canvasElem).generate(poi);
        const avatar     = new Avatar(canvas)
            .create(percentToPixel(5, 'y'), '#EC4865');
        map.user         = avatar;
    });

    // Utils {{{
    /**
     * Calculates distance between two points.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    const calcDistance = function (x1, y1, x2, y2) {
        const x = x2 - x1;
        const y = y2 - y1;
        return Math.sqrt(x * x + y * y);
    };

    /**
     * Converts percentage to pixel value relative to current window size.
     * @param {string|number} percent
     * @param {string} coord - Which coordinate value represents
     * @returns {number}
     * @throws {ReferenceError}
     */
    const percentToPixel = function (percent, coord) {
        percent = parseFloat(percent);
        switch (coord) {
            case 'x':
                return percent * window.innerWidth / 100;
            case 'y':
                return percent * window.innerHeight / 100;
            default:
                throw new ReferenceError('No coord: ' + coord);
        };
    };

    /**
     * Generate pseudo-random number within a range.
     * @param {number} from
     * @param {number} to
     */
    const randomRange = function (from, to) {
        return Math.random() * (to - from) + from;
    };

    const diff = function (a, b) {
        let ret = a - b;
        return ret >= 0 ? ret : -ret;
    };
    // }}}

    const addLabel = function (name, x, y) {
        x -= 10;
        y += 20;

        const label = document.createElement('div');
        label.setAttribute('class', 'label');
        label.setAttribute('style', `left: ${x}px; top: ${y}px;`);
        label.innerText = name;

        const overlayElem = document.querySelector('#overlay');
        overlayElem.appendChild(label);
    };

    /**
     * Shape with boundaries.
     * @class
     */
    class BoundedShape {
        // {{{
        /**
         * @constructor
         * @param {HTMLElement} elem
         */
        constructor(elem) {
            this._elem = elem;
        }

        get elem() {
            return this._elem;
        }
    }
    // }}}

    /**
     * Circle object with boundaries.
     * @class
     */
    class BoundCircle extends BoundedShape {
        // {{{
        get cx() {
            return this._cx;
        }

        get cy() {
            return this._cy;
        }

        get r() {
            return this._r;
        }

        /**
         * Recalculate relevant circle attributes.
         */
        refreshAttr() {
            this._cx = parseFloat(this._elem.getAttribute('cx'));
            this._cy = parseFloat(this._elem.getAttribute('cy'));
            this._r  = parseFloat(this._elem.getAttribute('r'));
        }
        
        /**
         * Checks if x, y values are within bounds.
         * @param {number} x
         * @param {number} y
         * @param {number} [r=0] - Radius
         * @returns {bool}
         */
        in(x, y, r = 0) {
            this.refreshAttr();
            r = this._r - r;

            if (r <= 0) {
                return false; // Child element too large for current element
            }
             
            return calcDistance(x, y, this._cx, this._cy) <= r;
        }

        /**
         * Moves element to a certain position.
         * @param {number} x
         * @param {number} y
         */
        moveTo(x, y) {
            this._elem.setAttribute('cx', x);
            this._elem.setAttribute('cy', y);
        }
    }
    // }}}

    /**
     * Line with boundaries.
     * @class
     */
    class BoundLine extends BoundedShape {
        // {{{
        /**
         * @constructor
         * @param {HTMLElement} elem
         * @param {string} direction - 'horizontal' or 'vertical'
         */
        constructor(elem, direction) {
            super(elem);
            this._direction = direction;
            this.refreshAttr();
        }

        /**
         * Recalculate relevant attributes.
         */
        refreshAttr() {
            this._x1 = parseInt(this._elem.getAttribute('x1'));
            this._y1 = parseInt(this._elem.getAttribute('y1'));

            switch (this._direction) {
                case 'horizontal':
                    this._x2 = parseInt(this._elem.getAttribute('x2'));
                    this._y2 = this._y1;
                    break;
                case 'vertical':
                    this._y2 = parseInt(this._elem.getAttribute('y2'));
                    this._x2 = this._x1;
                    break;
            }
        }

        in(x, y) {
            x = parseInt(x);
            y = parseInt(y);
            this.refreshAttr();

            const threshold = 9;
            switch (this._direction) {
                case 'horizontal':
                    console.log(y, this._y1);
                    if (diff(y, this._y1) > threshold) {
                        return false;
                    }

                    if (x === this._x1) {
                        return true;
                    } else if (x > this._x1) {
                        return this._x2 >= x;
                    } else {
                        return this._x2 <= x;
                    }
                    break;
                case 'vertical':
                    if (diff(x, this._x1) > threshold) {
                        return false;
                    }

                    if (y === this._y1) {
                        return true;
                    } else if (y > this._y1) {
                        return this._y2 >= y;
                    } else {
                        return this._y2 <= y;
                    }
                    break;
            }

            return false;
        }
    }
    // }}}

    /**
     * Snappable element.
     * @class
     */
    class Snappable {
        // {{{
        constructor() {
            this.snapZones = new Set();
            this._bounds   = null;
        }

        set bounds(bounds) {
            this._bounds = bounds;
        }

        /**
         * @param {SnapZone} snapZone
         */
        addSnapZone(snapZone) {
            this.snapZones.add(snapZone);
        }

        /**
         * Checks if coords are within bounds of snap zones.
         * @param {number} x
         * @param {number} y
         * @returns {bool}
         */
        inSnapZones(x, y) {
            const it     = this.snapZones.values();
            let snapZone = it.next().value;

            if (!snapZone) {
                return false;
            }

            this._bounds.refreshAttr();

            do {
                if (snapZone.in(x, y, this._bounds.r)) {
                    return true;
                }
                snapZone = it.next().value;
            } while (snapZone);

            return false;
        }

        /**
         * Move if able to specified coordinates.
         * @param {number} x
         * @param {number} y
         */
        moveTo(x, y) {
            if (!this.inSnapZones(x, y)) {
                return;
            }

            this._bounds.moveTo(x, y);
        }
    }
    // }}}

    /**
     * Constructs a draggable avatar.
     * @class
     */
    class Avatar extends Snappable {
        // {{{
        /**
         * @constructor
         * @param {SVG} canvas
         */
        constructor(canvas) {
            super();
            this._canvas = canvas;
            this._svg    = null;
            this._elem   = null;
            this._bounds = null;
        }

        get svg() {
            return this._svg;
        }

        get elem() {
            return this._elem;
        }

        /**
         * Create with specified color. Chainable method.
         * @param {string} diameter - As percentage
         * @param {string} color
         * @returns Avatar
         */
        create(diameter, color) {
            this._svg = this._canvas.circle(diameter).style('fill', color)
                .addClass('draggable');
            this._elem  = this._svg.node;
            this.bounds = new BoundCircle(this._elem);

            this._svg.draggable().on('dragmove', e => {
                e.preventDefault();
                this.moveTo(e.detail.p.x, e.detail.p.y);
            });

            return this;
        }
    }
    // }}}

    /**
     * Constructs a map of hyperlinks linked by paths.
     * @class
     */
    class Map {
        // {{{
        /**
         * @constructor
         * @param {SVG} canvas
         * @param {HTMLElement} canvasElem
         */
        constructor(canvas, canvasElem) {
            this._canvas   = canvas;
            this._elem     = canvasElem;
            this._startHub = null;
            this._user     = null;
            this._centerX  = percentToPixel(50, 'x');
            this._centerY  = percentToPixel(50, 'y');
            this._lines    = [];
        }

        /**
         * Sets primary user.
         * @param {Avatar} user
         */
        set user(user) {
            this._user = user;

            if (this._startHub) {
                this._user.svg.attr({
                    'cx': '0', 'cy': '0'
                }).animate({
                    'duration': 600, 'ease': '<>'
                }).attr({
                    'cx': this._centerX, 'cy': this._centerY
                });

                this._user.addSnapZone(this._startHub);
            }

            this._lines.forEach(line => {
                this._user.addSnapZone(line);
            });
        }

        get width() {
            return this._elem.getBoundingClientRect().width;
        }

        get height() {
            return this._elem.getBoundingClientRect().height;
        }

        /**
         * Generates paths. Chainable method.
         * @param {object[]} poi - Points of interest
         * @param {number} poi.id
         * @param {number} poi.parent_id
         * @param {string} poi.name
         * @param {number} poi.relevance - Higher value = greater relevance
         * @returns {Map}
         */
        generate(poi) {
            const circle   = this._canvas.circle(percentToPixel(10, 'y')).attr({
                'cx': this._centerX,
                'cy': this._centerY,
                'id': 'start-hub'
            }).addClass('map-piece');

            this._startHub = new BoundCircle(circle.node);
            this._startHub.refreshAttr();

            if (!poi || !poi.length) {
                return this._finishGenerate();
            }

            const padding = percentToPixel(5, 'y');
            poi.forEach(point => {
                let endpointX, endpointY;
                do {
                    endpointX = randomRange(padding, this.width - padding);
                    endpointY = randomRange(padding, this.height - padding);
                } while (endpointX === this._startHub.cx
                    && endpointY === this._startHub.cy);

                this._generatePathTo(point.name, endpointX, endpointY);
            });

            return this._finishGenerate();
        }

        /**
         * Called when finishing generating map.
         * @private
         * @returns {Map}
         */
        _finishGenerate() {
            const mapgenEvent = new window.Event('mapgen', {
                bubbles: true // Propagates outward
            });

            // this._startHub.node.dispatchEvent(mapgenEvent);

            return this;
        }

        /**
         * Creates path leading to specified coordinates.
         * @param {string} name
         * @param {number} x
         * @param {number} y
         */
        _generatePathTo(name, x, y) {
            let currentX  = this._startHub.cx;
            let currentY  = this._startHub.cy;
            let direction = !!Math.round(Math.random());
            let closeness = 0;
            let line;

            do {
                if (direction) {
                    let newX = randomRange(
                        closeness * x, this.width - closeness * (this.width - x));
                    line = this._canvas.line(currentX, currentY, newX, currentY);
                    currentX = newX;
                } else {
                    let newY = randomRange(
                        closeness * y, this.height - closeness * (this.height - y));

                    line = this._canvas.line(currentX, currentY, currentX, newY);
                    currentY = newY;
                }

                line.addClass('path');
                const boundLine = new BoundLine(
                    line.node, direction ? 'horizontal' : 'vertical');
                this._lines.push(boundLine);

                direction = !direction;
                closeness += Math.random();
                if (closeness > 1) {
                    closeness = 1;
                }
            } while (currentX !== x || currentY !== y);

            this._canvas.circle(percentToPixel(3, 'y')).addClass('poi').attr({
                'cx': x, 'cy': y
            });
            addLabel(name, x, y);
        }
    }
    // }}}
})(this, document);
