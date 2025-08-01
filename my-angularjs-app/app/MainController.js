app.controller('MainController', function ($q, $timeout, WeatherService) {

    var vm = this;
    vm.result = null;
    vm.error = null;
    vm.loading = false;
    vm.city = '';
    vm.isReady = false;
    vm.recentSearches = [];
    vm.popularCities = []; //popüler şehirler için yeni bir dizi
    vm.loadingPopular = false; //popüler şehirler yükleniyor mu kontrolü için
    vm.locationPreview = null; // Kullanıcının konumunu önizlemek için
    var cityImages = {};



    function initialize() {
        vm.isReady = false;
        vm.loadingPopular = true;

        WeatherService.initialize().then(function () {
            cityImages = WeatherService.getCityImagesData();
            vm.isReady = true;
            loadPopularCities();
            findUserLocation();
        }).catch(function (err) {
            vm.isReady = true;
            vm.error = "Uygulama verileri yüklenemedi. Lütfen sayfayı yenileyin.";
        });
    }

    function loadPopularCities() {
        vm.loadingPopular = true;
        var popularCitiesData = WeatherService.getPopularSearches();
        if (!popularCitiesData || popularCitiesData.length === 0) {
            vm.loadingPopular = false;
            return;
        }
        var promises = popularCitiesData.map(function (cityObject) {
            return WeatherService.getWeatherData(cityObject.name);
        });
        $q.all(promises).then(function (results) {
            vm.popularCities = results;
        }).finally(function () {
            vm.loadingPopular = false;
        });
    }

    function findUserLocation() {
        if (!navigator.geolocation) {
            return;
        }
        //vm.loading = true;

        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;

            WeatherService.getWeatherDataByCoords(lat, lon)
                .then(function (data) {
                    var apiCityName = data.weatherData.cityName.toLocaleLowerCase('tr-TR');
                    var matchedCityKey = Object.keys(cityImages).find(key => apiCityName.includes(key) || key.includes(apiCityName));
                    var cityTempC = data.weatherData.temp.c;
                    var cityTempF = data.weatherData.temp.f;

                    if (matchedCityKey) {
                        data.weatherData.cityName = cityImages[matchedCityKey].iconicName;
                    }

                    vm.locationPreview = data;
                })
                .catch(function (err) {
                    console.error("Konum için hava durumu verisi alınamadı:", err);
                })
                .finally(function () {
                    vm.loading = false;
                    vm.isReady = true;
                });

        }, function (error) {
            console.warn("Konum bulunamadı veya izin verilmedi.");
            vm.loading = false;
            vm.isReady = true;
            $timeout(function () { });
        });
    }

    initialize();

    vm.getWeather = function (cityToSearch) {
        var city = cityToSearch || vm.city;
        if (!city) return;

        vm.city = city;
        vm.result = null;
        vm.error = null;
        vm.loading = true;

        WeatherService.getWeatherData(city)
            .then(function (data) {
                vm.result = data;
                WeatherService.trackSearch(data.weatherData.cityName);
            })
            .catch(function (err) {
                vm.error = "Veriler alınırken bir hata oluştu. Şehir adını kontrol edip tekrar deneyin.";
            })
            .finally(function () {
                vm.loading = false;
            });
    };
    vm.displayCity = function (cityData) {
        console.log("Öneri kartına tıklandı:", cityData);
        // Tıklanan kartın verisini, ana sonuç değişkenine ata.
        vm.result = cityData;
        // Sayfayı, sonuçların olduğu yere kaydır (daha iyi bir UX için).
        window.scrollTo(0, document.body.scrollHeight);
    };

});