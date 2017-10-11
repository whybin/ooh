(function (window, document) {
    const drawBrowseGraphs = function () {
        const ctx = document.getElementById('graph').getContext('2d');
        let labels = [];
        let data = [];

        // Populate data arrays
        let labels = [], perYearData = [], totalJobsData = [];
        window.DB.occupations().each(occ => {
            labels.push(occ.name);
            perYearData.push(occ.pay_per_year);
            totalJobsData.push(occ.total_jobs);
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
                    }]
                },
                legend: { display: false },
                tooltips: {
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
