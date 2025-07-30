// angular modülünü tanımladım
var app = angular.module('myAngularJSApp', []);

app.controller('MainController', function ($http, $q, $timeout) {

    var vm = this;
    var weatherApiKey = "aeebbe0f83707b5e504c1a57fb975f51";
    var unsplashApiKey = "Mevp7tZ7IZ7QyUpwhOpkLVenh7kwe4rgWycgLpeRrqM";

    var weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather";
    var unsplashApiUrl = "https://api.unsplash.com/search/photos";

    vm.result = null;
    vm.error = null;
    vm.loading = false;
    vm.city = '';
    vm.isReady = false; //başlangıçta uygulama hazır değil

    var cityImages = {};

    function initialize() {
        $http.get('images.json').then(function (response) {
            cityImages = response.data;
            vm.isReady = true; // Uygulama verileri yüklendiğinde hazır
            console.log("Özel resim veritabanı (images.json) başarıyla yüklendi!");
        }).catch(function (err) {
            console.error("images.json dosyası yüklenirken bir hata oluştu:", err);
            vm.error = "Uygulama verileri yüklenemedi. Lütfen sayfayı yenileyin.";
        });
    }

    initialize();

    vm.getWeather = function () {
        vm.result = null;
        vm.error = null;
        vm.loading = true;

        $http.get(weatherApiUrl + '?q=' + vm.city + '&appid=' + weatherApiKey + '&units=metric&lang=tr')
            .then(function (weatherResponse) {
                var weatherData = weatherResponse.data;
                var finalWeatherData = {
                    cityName: weatherData.name,
                    temp: Math.round(weatherData.main.temp),
                    humidity: weatherData.main.humidity,
                    windSpeed: weatherData.wind.speed,
                    feelsLike: Math.round(weatherData.main.feels_like),
                    description: weatherData.weather[0].description,
                    iconUrl: 'https://openweathermap.org/img/wn/' + weatherData.weather[0].icon + '@2x.png'
                };

                var cityKey = weatherData.name.toLocaleLowerCase('tr-TR');
                var weatherCondition = weatherData.weather[0].main;


                if (cityImages && cityImages[cityKey]) {
                    // Bu şehir bizim özel listemizde var!
                    var cityData = cityImages[cityKey];
                    var imageUrl = cityData.defaultImage;

                    if (cityData.weatherImages && cityData.weatherImages[weatherCondition]) {
                        imageUrl = cityData.weatherImages[weatherCondition];
                    }

                    console.log("Özel veritabanından resim kullanılıyor.");

                    $timeout(function () {
                        vm.result = {
                            weatherData: finalWeatherData,
                            imageData: { imageUrl: imageUrl }
                        };
                    });

                    vm.loading = false;

                } else {
                    // Bu şehir listemizde yok, Unsplash'e soralım.
                    console.log("Özel veritabanından resim bulunamadı, Unsplash API'si kullanılacak.");
                    var searchQuery = weatherData.name + ', Turkey ' + weatherCondition;

                    return $http.get(unsplashApiUrl + '?query=' + encodeURIComponent(searchQuery) + '&client_id=' + unsplashApiKey)
                        .then(function (imageResponse) {
                            var imageData = imageResponse.data;
                            var finalImageData = {
                                imageUrl: imageData.results.length > 0 ? imageData.results[0].urls.regular : null
                            };

                            $timeout(function () {
                                vm.result = {
                                    weatherData: finalWeatherData,
                                    imageData: finalImageData
                                };
                            });
                        });
                }
            })
            .catch(function (err) {
                vm.error = "Veriler alınırken bir hata oluştu. Şehir adını kontrol edip tekrar deneyin.";
            })
            .finally(function () {
                if (vm.loading) {
                    vm.loading = false;
                }
            });
    };
});

app.component('weatherDisplay', {
    templateUrl: 'weather-display.html',
    bindings: { weatherInfo: '<' },
    controller: function () { this.vm = this; },
    controllerAs: 'vm'
});

app.component('imageDisplay', {
    templateUrl: 'image-display.html',
    bindings: { imageInfo: '<' },
    controller: function () { this.vm = this; },
    controllerAs: 'vm'
});