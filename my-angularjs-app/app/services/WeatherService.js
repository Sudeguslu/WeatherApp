app.factory('WeatherService', function ($http, $q) {
    var weatherApiKey = "aeebbe0f83707b5e504c1a57fb975f51";
    var unsplashApiKey = "Mevp7tZ7IZ7QyUpwhOpkLVenh7kwe4rgWycgLpeRrqM";
    var weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather";
    var unsplashApiUrl = "https://api.unsplash.com/search/photos";
    var cityImages = {};

    function initialize() {
        return $http.get('assets/data/images.json').then(function (response) {
            cityImages = response.data;
            console.log("WeatherService: Özel resim veritabanı yüklendi!");
        });
    }

    function processWeatherData(weatherResponse) {
        var weatherData = weatherResponse.data;
        var tempC = Math.round(weatherData.main.temp);
        var tempF = Math.round((tempC * 9 / 5) + 32);
        var feelsLikeC = Math.round(weatherData.main.feels_like);
        var feelsLikeF = Math.round((feelsLikeC * 9 / 5) + 32);
        var finalWeatherData = {
            cityName: weatherData.name,
            temp: {
                c: tempC,
                f: tempF
            },
            feelsLike: {
                c: feelsLikeC,
                f: feelsLikeF
            },
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
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
            console.log("WeatherService: Özel veritabanından resim kullanılıyor.")
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
            .then(processWeatherData); 
    }

    function getWeatherDataByCoords(lat, lon) {
        return $http.get(weatherApiUrl + '?lat=' + lat + '&lon=' + lon + '&appid=' + weatherApiKey + '&units=metric&lang=tr')
            .then(processWeatherData); 
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

        var formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLocaleLowerCase('tr-TR');

        var cityIndex = searchData.findIndex(function (item) {
            return item.name === formattedCityName;
        });

        if (cityIndex > -1) {
            searchData[cityIndex].count++;
        } else {
            searchData.push({ name: formattedCityName, count: 1 });
        }

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