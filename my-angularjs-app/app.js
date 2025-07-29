// angular modülünü tanımladım
var app = angular.module('myAngularJSApp', []);

//controller'ı tanımladım
app.controller('MainController', function($http) {

    var vm = this;
    var apiKey = "aeebbe0f83707b5e504c1a57fb975f51";
    var apiUrl = "https://api.openweathermap.org/data/2.5/weather";

    // Başlangıçta gerekli değişkenleri tanımladım
    vm.result = null;
    vm.error = null;
    vm.loading = false;

    // Başlangıçta şehir ismini boş olarak ayarladım
    vm.city = '';

    // Hava durumu verilerini almak için fonksiyon
    vm.getWeather = function() {
        // Her yeni istek öncesi eski durumu sıfırla
        vm.result = null;
        vm.error = null;
        vm.loading = true;
        console.log("Hava durumu alınıyor...", vm.city);

        // API isteği yapılıyor
        $http({
            method: 'GET',
            url: apiUrl + '?q=' + vm.city + '&appid=' + apiKey + '&units=metric&lang=tr'

        }).then(function successCallback(response) { 
            // API isteği başarılı olduğunda
            var apiData = response.data;
            vm.result = {
                cityName: apiData.name,
                temp: Math.round(apiData.main.temp), // Sıcaklık değeri yuvarlanıyor
                description: apiData.weather[0].description,
                iconUrl: "https://openweathermap.org/img/wn/" + apiData.weather[0].icon + "@2x.png",
                humidity: apiData.main.humidity, // Nem oranı
                windSpeed: apiData.wind.speed, // Rüzgar hızı
                feelsLike: Math.round(apiData.main.feels_like) // Hissedilen sıcaklık
            };

        }, function errorCallback(response) {
            // API isteği başarısız olduğunda
            vm.error = "Şehir bulunamadı veya bir API hatası oluştu. Lütfen tekrar deneyin.";
            
        }).finally(function() {
            // İstek başarılı da olsa, başarısız da olsa bu blok çalışır.
            // Yükleniyor durumunu sonlandır.
            vm.loading = false;

        });
    
    };
});