(function (window, document) {
    const drawBrowseGraphs = function () {
        const canvasElem = document.querySelector('#graph');
        const ctx = canvasElem.getContext('2d');

        // Populate data arrays
        let labels = [];
        let perYearData = [], totalJobsData = [], jobGrowthData = [];
        window.DB.occupations().each(occ => {
            labels.push(occ.name);
            perYearData.push(occ.pay_per_year);
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
        addDataset(datasets, 'totalJobsAxis', totalJobsData, '#dde3ef');
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
                                    }) + ' yearly median pay';
                                case 1:
                                    return ' ' + item.yLabel.toLocaleString()
                                        + ' jobs, 2014';
                                case 2:
                                    return ' ' + item.yLabel.toLocaleString()
                                        + '% (job '
                                        + (item.yLabel >= 0 ? 'growth' : 'decline')
                                        + ')';
                            }
                        }
                    }
                }
            }
        });
    };

    window.addEventListener('load', function () {
        window.DB = window.DB || {};
        if ('occupations' in window.DB === false) {
            window.DB.occupations = TAFFY(window.DATA.occupations);
        }

        drawBrowseGraphs();
    });
})(this, document);
