(function (window, document) {
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

    const drawBrowseGraphs = function () {
        // {{{
        const canvasElem = document.querySelector('#graph');
        const ctx = canvasElem.getContext('2d');

        // Populate data arrays
        let labels = [];
        let perYearData = [], totalJobsData = [], jobGrowthData = [];
        const WORK_HOURS_PER_YEAR = 2080;
        window.DB.occupations().each(occ => {
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

        const datasets = [];
        const addDataset = function (datasets, id, data, color) {
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

        addDataset(datasets, 'perYearAxis', perYearData, '#5ed7a3');
        addDataset(datasets, 'totalJobsAxis', totalJobsData, '#e96073');
        addDataset(datasets, 'jobGrowthAxis', jobGrowthData, '#f08226');

        const graphs = new Chart(ctx, {
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

    const setupEventListeners = function () {
        // {{{
        const fuse = new Fuse(window.DB.occupations().get(), {
            shouldSort: true,
            location: 0,
            distance: 5,
            threshold: 0.7,
            maxPatternLength: 32,
            keys: [
                { name: 'name', weight: 0.75 },
                { name: 'brief', weight: 0.25 }
            ]
        });

        const searchInput = document.querySelector('#search-input');
        searchInput.addEventListener('input', throttle(function (e) {
            const value = e.target.value;
            if (value.length < 3) {
                return;
            }

            console.log(fuse.search(value));
        }, 300));
    };
    // }}}

    window.addEventListener('load', function () {
        window.DB = window.DB || {};
        if ('occupations' in window.DB === false) {
            window.DB.occupations = TAFFY(window.DATA.occupations);
        }

        drawBrowseGraphs();
        setupEventListeners();
    });
})(this, document);
