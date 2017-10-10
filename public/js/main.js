(function (window, document) {
    const drawBrowseGraphs = function () {
        const ctx = document.getElementById('graph').getContext('2d');
        let labels = [];
        let data = [];

        window.DB.occupations().each(occ => {
            labels.push(occ.name);
            data.push(occ.pay_per_year);
        });

        var myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: '#5ed7a3',
                    borderWidth: 2,
                    pointBackgroundColor: '#5ed7a3',
                    pointBorderWidth: 0,
                    fill: false
                }]
            },
            options: {
                scales: {
                    xAxes: [{ display: false }],
                    yAxes: [{ display: false }]
                },
                legend: { display: false },
                tooltips: {
                    callbacks: {
                        label: item => ' ' + item.yLabel.toLocaleString('en-US', {
                            style: 'currency', currency: 'usd'
                        }) + ' yearly median pay'
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
