app.component('chartDisplay', {
    templateUrl: 'app/components/chartDisplay/chart-display.html',
    bindings: {
        weatherInfo: '<'
    },
    controller: function () {
        var vm = this;

        this.$onChanges = function (changes) {
            if (changes.weatherInfo && changes.weatherInfo.currentValue) {
                var data = changes.weatherInfo.currentValue;

                vm.labels = ['Sıcaklık (°C)', 'Sıcaklık (°F)', 'Hissedilen (°C)', 'Hissedilen (°F)', 'Nem (%)', 'Rüzgar (m/s)'];
                vm.data =
                    [
                        data.temp.c,
                        data.temp.f,
                        data.feelsLike.c,
                        data.feelsLike.f,
                        data.humidity,
                        data.windSpeed
                    ];

                vm.colors = ['#6ED1FF', '#0F8BAA', '#023047', '#670000', '#FB8500', '#FFB703'];
                vm.options = {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                };
            }
        };
    },
    controllerAs: 'vm'
});