app.component('weatherDisplay', {
    templateUrl: 'app/components/weatherDisplay/weather-display.html',
    bindings: {
        weatherInfo: '<'
    },
    controller: function () {
        var vm = this;
    },
    controllerAs: 'vm'
});