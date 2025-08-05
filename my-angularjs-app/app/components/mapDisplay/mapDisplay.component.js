app.component('mapDisplay', {
    templateUrl: 'app/components/mapDisplay/map-display.html',
    bindings: {
        weatherInfo: '<'
    },
    controller: function () {
        var vm = this;

        angular.extend(vm, {
            center: { 
                lat: 39,
                lng: 35,
                zoom: 5
            },
            markers: {},
            defaults: {
                scrollWheelZoom: true
            }
        });


        this.$onChanges = function (changes) {
            if (changes.weatherInfo && changes.weatherInfo.currentValue) {
                var data = changes.weatherInfo.currentValue;
                var coords = data.coord;


                vm.center = {
                    lat: coords.lat,
                    lng: coords.lon,
                    zoom: 10
                };

                vm.markers.mainMarker = {
                    lat: coords.lat,
                    lng: coords.lon,
                    message: data.cityName,
                    focus: true,
                    draggable: false
                };
            }
        };
    },
    controllerAs: 'vm'
});