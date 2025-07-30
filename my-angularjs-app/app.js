// angular modülünü tanımladım
var app = angular.module('myAngularJSApp', ['chart.js']);

app.factory('WeatherService', function ($http, $q) {
    var weatherApiKey = "aeebbe0f83707b5e504c1a57fb975f51";
    var unsplashApiKey = "Mevp7tZ7IZ7QyUpwhOpkLVenh7kwe4rgWycgLpeRrqM";
    var weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather";
    var unsplashApiUrl = "https://api.unsplash.com/search/photos";
    var cityImages = {};

    function initialize() {
        return $http.get('images.json').then(function (response) {
            cityImages = response.data;
            console.log("WeatherService: Özel resim veritabanı yüklendi!");
        });
    }

    function getWeatherData(city) {
        return $http.get(weatherApiUrl + '?q=' + city + '&appid=' + weatherApiKey + '&units=metric&lang=tr')
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
                    var cityData = cityImages[cityKey];
                    var imageUrl = cityData.defaultImage;
                    if (cityData.weatherImages && cityData.weatherImages[weatherCondition]) {
                        imageUrl = cityData.weatherImages[weatherCondition];
                    }
                    console.log("WeatherService: Özel veritabanından resim kullanılıyor.");
                    return { weatherData: finalWeatherData, imageData: { imageUrl: imageUrl } };
                } else {
                    console.log("WeatherService: Unsplash API'si kullanılacak.");
                    var searchQuery = weatherData.name + ', Turkey ' + weatherCondition;
                    return $http.get(unsplashApiUrl + '?query=' + encodeURIComponent(searchQuery) + '&client_id=' + unsplashApiKey)
                        .then(function (imageResponse) {
                            var imageData = imageResponse.data;
                            var finalImageData = { imageUrl: imageData.results.length > 0 ? imageData.results[0].urls.regular : null };
                            return { weatherData: finalWeatherData, imageData: finalImageData };
                        });
                }
            });
    }

    function getRecentSearches() {
        var searches = localStorage.getItem('recentWeatherSearches');
        return searches ? JSON.parse(searches) : [];
    }
    
    function addRecentSearch(city) {
        if (!city) return;
        var searches = getRecentSearches();
        var cityName = city.charAt(0).toUpperCase() + city.slice(1).toLocaleLowerCase('tr-TR');
        if (searches.includes(cityName)) {
            searches = searches.filter(s => s !== cityName);
        }
        searches.unshift(cityName);
        searches = searches.slice(0, 3);
        localStorage.setItem('recentWeatherSearches', JSON.stringify(searches));
    }

    return {
        initialize: initialize,
        getWeatherData: getWeatherData,
        getRecentSearches: getRecentSearches,
        addRecentSearch: addRecentSearch
    };
});

app.controller('MainController', function ($timeout, WeatherService) {

    var vm = this;
    vm.result = null;
    vm.error = null;
    vm.loading = false;
    vm.city = '';
    vm.isReady = false;
    vm.recentSearches = [];

    WeatherService.initialize().then(function () {
        vm.isReady = true;
        vm.recentSearches = WeatherService.getRecentSearches();
    }).catch(function (err) {
        vm.isReady = true;
        vm.error = "Uygulama verileri yüklenemedi. Lütfen sayfayı yenileyin.";
    });

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
                WeatherService.addRecentSearch(data.weatherData.cityName);
                vm.recentSearches = WeatherService.getRecentSearches();
            })
            .catch(function (err) {
                vm.error = "Veriler alınırken bir hata oluştu. Şehir adını kontrol edip tekrar deneyin.";
            })
            .finally(function () {
                vm.loading = false;
            });
    };
});


app.component('weatherDisplay', {
    templateUrl: 'weather-display.html', // Bu component'in HTML şablonunun yolu
    bindings: {
        weatherInfo: '<' // Dışarıdan 'weather-info' adıyla veri bekler. '<' tek yönlü veri akışıdır.
    },
    controller: function () {
        // Component'in kendi iç mantığı için 'vm' (View-Model)
        var vm = this;
    },
    controllerAs: 'vm'
});

// 2. Şehir Resmi Gösterim Component'i
app.component('imageDisplay', {
    templateUrl: 'image-display.html', // Bu component'in HTML şablonu
    bindings: {
        imageInfo: '<' // Dışarıdan 'image-info' adıyla veri bekler.
    },
    controller: function () {
        var vm = this;
    },
    controllerAs: 'vm'
});



app.component('chartDisplay', {
    templateUrl: 'chart-display.html',
    bindings: {
        weatherInfo: '<'
    }, 
    controller: function () {
        var vm = this;
        
        this.$onChanges = function(changes) {
            if (changes.weatherInfo && changes.weatherInfo.currentValue) {
                var data = changes.weatherInfo.currentValue;

                vm.labels = ['Sıcaklık (°C)', 'Hissedilen (°C)', 'Nem (%)', 'Rüzgar (m/s)'];
                vm.data = [
                    data.temp,
                    data.feelsLike,
                    data.humidity,
                    data.windSpeed
                ];
                
                vm.colors = ['#4D5360', '#949FB1', '#46BFBD', '#FDB45C'];
                vm.options = {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                };
            }
        };
    },
    controllerAs: 'vm'
});