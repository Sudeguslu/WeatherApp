app.component('imageDisplay', {
    templateUrl: 'app/components/imageDisplay/image-display.html',
    bindings: {
        imageInfo: '<'
    },
    controller: function () {
        var vm = this;
    },
    controllerAs: 'vm'
});