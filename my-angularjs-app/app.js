// angular modülünü tanımladım
var app = angular.module('myAngularJSApp', ['chart.js', 'leaflet-directive']);

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

    function processWeatherData(weatherResponse) {
        var weatherData = weatherResponse.data;
        var finalWeatherData = {
            cityName: weatherData.name,
            temp: Math.round(weatherData.main.temp),
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
            feelsLike: Math.round(weatherData.main.feels_like),
            description: weatherData.weather[0].description,
            coord: weatherData.coord,
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
            // Bir promise döndürmek yerine, doğrudan çözülmüş bir promise döndürüyoruz.
            return $q.when({ weatherData: finalWeatherData, imageData: { imageUrl: imageUrl } });
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
    }

    function getWeatherData(city) {
        return $http.get(weatherApiUrl + '?q=' + city + '&appid=' + weatherApiKey + '&units=metric&lang=tr')
            .then(processWeatherData); // Gelen sonucu doğrudan ortak fonksiyona yönlendir.
    }

    // DÜZELTME: Eksik olan getWeatherDataByCoords fonksiyonunu ekledik.
    function getWeatherDataByCoords(lat, lon) {
        return $http.get(weatherApiUrl + '?lat=' + lat + '&lon=' + lon + '&appid=' + weatherApiKey + '&units=metric&lang=tr')
            .then(processWeatherData); // Gelen sonucu doğrudan ortak fonksiyona yönlendir.
    }

    function getPopularSearches() {

        var searches = localStorage.getItem('weatherAppSearches');
        var searchData = searches ? JSON.parse(searches) : [];

        searchData.sort(function (a, b) {
            return b.count - a.count;
        });

        return searchData.slice(0, 3);
    }

    function trackSearch(cityName) {
        if (!cityName) return;

        var searches = localStorage.getItem('weatherAppSearches');
        var searchData = searches ? JSON.parse(searches) : [];

        // Gelen şehir adını standart bir formata getir (Baş Harfi Büyük)
        var formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLocaleLowerCase('tr-TR');

        // Şehrin listede olup olmadığını bul
        var cityIndex = searchData.findIndex(function (item) {
            return item.name === formattedCityName;
        });

        if (cityIndex > -1) {
            // Şehir zaten var, sadece sayacını bir artır
            searchData[cityIndex].count++;
        } else {
            // Şehir yeni, listeye ekle
            searchData.push({ name: formattedCityName, count: 1 });
        }

        // Güncellenmiş listeyi tekrar localStorage'a kaydet
        localStorage.setItem('weatherAppSearches', JSON.stringify(searchData));
    }

    function getCityImagesData() {
        return cityImages;

    }

    return {
        initialize: initialize,
        getCityImagesData: getCityImagesData,
        getWeatherData: getWeatherData,
        getWeatherDataByCoords: getWeatherDataByCoords,
        getPopularSearches: getPopularSearches,
        trackSearch: trackSearch

    };
});

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


app.component('weatherDisplay', {
    templateUrl: 'weather-display.html',
    bindings: {
        weatherInfo: '<'
    },
    controller: function () {
        var vm = this;
    },
    controllerAs: 'vm'
});

// 2. Şehir Resmi Gösterim Component'i
app.component('imageDisplay', {
    templateUrl: 'image-display.html',
    bindings: {
        imageInfo: '<'
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

        this.$onChanges = function (changes) {
            if (changes.weatherInfo && changes.weatherInfo.currentValue) {
                var data = changes.weatherInfo.currentValue;

                vm.labels = ['Sıcaklık (°C)', 'Hissedilen (°C)', 'Nem (%)', 'Rüzgar (m/s)'];
                vm.data =
                    [
                        data.temp,
                        data.feelsLike,
                        data.humidity,
                        data.windSpeed
                    ];

                vm.colors = ['#4D5360', '#949FB1', '#46BFBD', '#FDB45C'];
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


app.component('mapDisplay', {
    templateUrl: 'map-display.html',
    bindings: {
        weatherInfo: '<'
    },
    controller: function () {
        var vm = this;

        // Harita için temel başlangıç ayarları
        angular.extend(vm, {
            center: { // Başlangıçta Türkiye'yi ortala
                lat: 39,
                lng: 35,
                zoom: 5
            },
            markers: {}, // Başlangıçta hiç işaretçi olmasın
            defaults: {
                scrollWheelZoom: true // Fare tekerleği ile yakınlaştırma etkin
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

