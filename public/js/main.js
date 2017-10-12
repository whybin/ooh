(function (window, document) {
    const WORK_HOURS_PER_YEAR = 2080;

    // Element utilities {{{
    /**
     * Display element
     * @param {HTMLElement} elem
     */
    const showElem = function (elem) {
        const classes = elem.getAttribute('class');
        elem.setAttribute('class', classes.replace(/ ?hidden/g, ''));
    };

    /**
     * Hide element
     * @param {HTMLElement} elem
     */
    const hideElem = function (elem) {
        const classes = elem.getAttribute('class');
        elem.setAttribute('class', classes + ' hidden');
    }
    // }}}

    /**
     * Returns throttled input function.
     * @param {Function} func
     * @param {number} [delay=1000] - Delay in milliseconds
     * @returns {Function}
     */
    const throttle = function (func, delay = 1000) {
        // {{{
        let timeout = null;

        return function () {
            if (timeout !== null) {
                return;
            }

            let args = arguments;
            timeout = window.setTimeout(() => {
                timeout = null;
                func(...args);
            }, delay);
        };
    };
    // }}}

    /**
     * Format dataset for chart.js
     * @param {object[]} datasets - Mutable array
     * @param {string} id - Y axis ID
     * @param {number[]} data
     * @param {string} color
     */
    const addDataset = function (datasets, id, data, color) {
        // {{{
        datasets.push({
            yAxisID: id,
            data: data,
            borderColor: color,
            borderWidth: 1,
            pointBackgroundColor: color,
            pointBorderWidth: 0,
            fill: false
        });
    };
    // }}}

    /**
     * Populate labels and dataset arrays.
     * @param {object[]} dataSource
     * @param {string[]} labels - Mutable
     * @param {object[]} datasets - Mutable
     */
    const populateData = function (dataSource, labels, datasets) {
        // {{{
        let perYearData = [], totalJobsData = [], jobGrowthData = [];
        dataSource.forEach(occ => {
            labels.push(occ.name);

            // Get pay per year or estimate from per-hour value
            let payPerYear = occ.pay_per_year;
            if (payPerYear == null) {
                payPerYear = occ.pay_per_hour * WORK_HOURS_PER_YEAR;
            }

            perYearData.push(payPerYear);
            totalJobsData.push(occ.total_jobs);
            jobGrowthData.push(occ.job_growth);
        });

        addDataset(datasets, 'perYearAxis', perYearData, '#5ed7a3');
        addDataset(datasets, 'totalJobsAxis', totalJobsData, '#e96073');
        addDataset(datasets, 'jobGrowthAxis', jobGrowthData, '#f08226');
    };
    // }}}

    /**
     * Initial draw execution of graphs.
     * @returns {Chart}
     */
    const drawBrowseGraphs = function () {
        // {{{
        const canvasElem = document.querySelector('#graph');
        const ctx = canvasElem.getContext('2d');

        let labels = [], datasets = [];
        populateData(window.DB.occupations().get(), labels, datasets);

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    xAxes: [{ display: false }],
                    yAxes: [{
                        id: 'perYearAxis',
                        display: false
                    }, {
                        id: 'totalJobsAxis',
                        display: false
                    }, {
                        id: 'jobGrowthAxis',
                        display: false
                    }]
                },
                elements: {
                    point: { hoverRadius: 6 }
                },
                legend: { display: false },
                layout: { padding: 5 },
                tooltips: {
                    mode: 'index',
                    titleFontFamily: 'Seravek',
                    bodyFontFamily: 'Seravek',
                    titleFontSize: 16,
                    bodyFontSize: 14,
                    xPadding: 9,
                    yPadding: 9,
                    callbacks: {
                        label: item => {
                            switch (item.datasetIndex) {
                                case 0:
                                    return ' ' + item.yLabel.toLocaleString('en-US', {
                                        style: 'currency', currency: 'usd'
                                    }) + ' yearly pay';
                                case 1:
                                    return ' ' + item.yLabel.toLocaleString()
                                        + ' jobs';
                                case 2:
                                    return ' ' + item.yLabel.toLocaleString()
                                        + '% (job '
                                        + (item.yLabel >= 0 ? 'growth' : 'decline')
                                        + ')';
                            }
                        }
                    }
                },
                onHover: (e, active) => {
                    let classes = canvasElem.getAttribute('class');

                    classes = active.length
                        ? classes + ' clickable'
                        : classes.replace(/ clickable/g, '');
                    canvasElem.setAttribute('class', classes);
                },
                onClick: (e, active) => {
                    if (!active.length) {
                        return;
                    }
                    
                    let id = active[0]._index;
                    window.location.pathname = '/occupations/' + id;
                }
            }
        });
    };
    // }}}

    const search = {
        filters: {
            pay_per_year: {}
        },

        fuseOptions: {
            shouldSort: true,
            tokenize: true,
            threshold: 0.2,
            maxPatternLength: 32,
            keys: [
                { name: 'name', weight: 0.75 },
                { name: 'brief', weight: 0.25 }
            ]
        },

        searchInput: '',

        searchFor: function (graphs, input = null) {
            let dataSource = window.DB.occupations(search.filters).get();

            if (input === null) {
                input = search.searchInput;
            } else {
                search.searchInput = input;
            }

            if (input.length >= 3) {
                const fuse = new Fuse(dataSource, search.fuseOptions);
                dataSource = fuse.search(input);
            }

            const labels = [], datasets = [];
            populateData(dataSource, labels, datasets);

            graphs.data.labels = labels;
            graphs.data.datasets = datasets;
            graphs.update();
        }
    };

    const setupEventListeners = function (graphs) {
        // {{{
        const searchInput = document.querySelector('#search-input');
        searchInput.addEventListener('click', function () {
            // {{{
            const moreElem = document.querySelector('#form-more');
            if (moreElem.getAttribute('class').indexOf('hidden') === -1) {
                return;
            }
            showElem(moreElem);

            // Add values to input ranges
            const db = window.DB.occupations();
            moreElem.querySelectorAll('.median-pay').forEach(input => {
                let minPay = db.min('pay_per_year');
                const minEstimatedPay = db.min('pay_per_hour')
                    * WORK_HOURS_PER_YEAR;
                if (minEstimatedPay < minPay) {
                    minPay = minEstimatedPay;
                }
                minPay = Math.floor(minPay / 1000) * 1000;

                let maxPay = db.max('pay_per_year');
                const maxEstimatedPay = db.max('pay_per_hour')
                    * WORK_HOURS_PER_YEAR;
                if (maxEstimatedPay > maxPay) {
                    maxPay = maxEstimatedPay;
                }
                maxPay = Math.ceil(maxPay / 1000) * 1000;

                input.setAttribute('min', minPay);
                input.setAttribute('max', maxPay);
                input.setAttribute('step', 1000);

                moreElem.querySelector('input[name="median-pay-min"]')
                    .setAttribute('value', minPay);
                moreElem.querySelector('input[name="median-pay-max"]')
                    .setAttribute('value', maxPay);
            });
        });
        // }}}

        searchInput.addEventListener('input', throttle(function (e) {
            // {{{
            const value = e.target.value;
            if (value.length && value.length < 3) {
                return;
            }

            search.searchFor(graphs, value);
        }, 600));
        // }}}

        // Handle tooltips {{{
        const getTooltip = function (e) {
            return e.target.parentNode.querySelector('.tooltip');
        };

        const updateTooltip = function (e, thumb) {
            const tooltipElem = getTooltip(e);
            const rect = thumb.getBoundingClientRect();
            let xOffset = e.layerX - 10;

            if (xOffset < 0) {
                xOffset = 0;
            }
            if (xOffset > rect.width - 10) {
                xOffset = rect.width - 10;
            }

            tooltipElem.setAttribute('style', `left: ${xOffset}px`);

            const classes = thumb.getAttribute('class');
            let text = thumb.value;
            if (classes.indexOf('median-pay') > -1) {
                text = '$' + parseFloat(text).toLocaleString();
            } else if (classes.indexOf('job-growth') > -1) {
                text += '%';
            }

            tooltipElem.innerText = text;
            showElem(tooltipElem);
        };
        // }}}

        const filterSearch = throttle(function (thumb) {
            const classes = thumb.getAttribute('class');
            if (classes.indexOf('median-pay') > -1) {
                let min = parseFloat(
                    document.querySelector('input[name="median-pay-min"]').value);
                let max = parseFloat(
                    document.querySelector('input[name="median-pay-max"]').value);

                console.log(min,max);
                if (min > max) {
                    let temp = min;
                    min = max;
                    max = temp;
                }

                search.filters.pay_per_year = { gte: min, lte: max };
            } else if (classes.indexOf('job-growth') > -1) {
            }

            search.searchFor(graphs);
        }, 800);

        const rangeThumbs =
            document.querySelectorAll('input[type="range"]');
        rangeThumbs.forEach(thumb => {
            const mousemoveFunc = function (e) {
                updateTooltip(e, thumb);
                filterSearch(thumb);
            };

            thumb.addEventListener('mousedown', e => {
                thumb.addEventListener('mousemove', mousemoveFunc);
            });

            thumb.addEventListener('mouseover', e => updateTooltip(e, thumb));
            thumb.addEventListener('mouseout', e => hideElem(getTooltip(e)));
            thumb.addEventListener('mouseup', e => {
                thumb.removeEventListener('mousemove', mousemoveFunc);
                hideElem(getTooltip(e));
            });
        });
    };
    // }}}

    window.addEventListener('load', function () {
        window.DB = window.DB || {};
        if ('occupations' in window.DB === false) {
            window.DB.occupations = TAFFY(window.DATA.occupations);
        }

        const graphs = drawBrowseGraphs();
        setupEventListeners(graphs);
    });
})(this, document);
