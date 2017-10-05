(function (window, document) {
    window.addEventListener('load', function () {
        const canvas = SVG('canvas');
        const map    = new Map(canvas).generate();
        const avatar = new Avatar(canvas).create(percentToPixel(5, 'y'), '#EC4865');
        map.user     = avatar;
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
    // }}}

    /**
     * Circle object with boundaries.
     */
    class BoundCircle {
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
        /**
         * @constructor
         * @param {HTMLElement} canvasElem
         */
        constructor(canvas) {
            this._canvas    = canvas;
            this._startHub = null;
            this._user     = null;
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
                    'cx': percentToPixel(50, 'x'), 'cy': percentToPixel(50, 'y')
                });

                this._user.addSnapZone(this._startHub);
            }
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
                'cx': percentToPixel(50, 'x'),
                'cy': percentToPixel(50, 'y'),
                'id': 'start-hub'
            }).addClass('map-piece');

            this._startHub = new BoundCircle(circle.node);

            if (!poi || !poi.length) {
                return this._finishGenerate();
            }

            poi.forEach(point => {
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
    }
})(this, document);
