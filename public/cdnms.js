var app = angular.module('cdnms', ['btford.socket-io']);

app.factory('socket', function (socketFactory) {
  return socketFactory({
    ioSocket: io.connect('/')
  });
})

app.controller('cdnms', function($scope, socket, $http) {
    $scope.words=[]
    $scope.spy=[]
    $scope.n=25
    $scope.set="original"
    $scope.confirm=true
    $scope.timer=0
    $scope.time=0 //60*1000 ms
    $scope.spymaster=false
    $scope.teama=0
    $scope.teamb=0
    $scope.neutral=0
    $scope.room=String(Math.floor(Math.random()*9000) + 1000)
    socket.emit('join', $scope.room);
    $scope.selected=[]
    $scope.last=-1
    var initializing=true
    
    function getwords(n,set, seed) {
        $scope.room=seed
        $http.post( "/words", { 'n' : n, 'set' : set, 'seed':seed} )
        .then(function(result) {
            $scope.words = result.data.words;
            $scope.spy = result.data.spy;
            console.log(result.data)
            $scope.teama=$scope.spy.reduce(function(a, e, i) {if (e === 'bg-teama')a.push(i);return a;}, []);
            $scope.teamb=$scope.spy.reduce(function(a, e, i) {if (e === 'bg-teamb')a.push(i);return a;}, []);
        });
    }
    
    $scope.countdown = function(){
        var timer=$scope.time
        var count=setTimeout(function () {
            $scope.time = timer-1
            $scope.$apply()
            if($scope.time>0){
                $scope.countdown()
            }
            else{
                $scope.time = $scope.timer
                $scope.$apply()
            }
        }, 1000);
        
    }
    
    $scope.joinroom = function(){
        if($scope.roomform){
            $scope.room=$scope.roomform
            socket.emit('join', $scope.roomform);
            getwords($scope.n, $scope.set, $scope.roomform)
            $scope.selected=[]
        }
    }
    
    $scope.changeset = function(){
        getwords($scope.n, $scope.set, $scope.room)
        $scope.selected=[]
    }
    
    getwords($scope.n,$scope.set,$scope.room)
    
    $scope.select = function(word){
        if ($scope.selected.indexOf(word)==-1) {
            if ($scope.confirm && $scope.last==-1){
                $scope.last=$scope.words.indexOf(word)
                $("#confirm-modal").modal('show')
            }
            else {
                //$(('#word'+String(word))).addClass(getClass(word))
                //$(('#word'+String(word))).addClass('active')
                $scope.selected.push(word)
                if($scope.teama.indexOf(word)!=-1){
                   $scope.teama.splice($scope.teama.indexOf(word),1)
                }
                if($scope.teamb.indexOf(word)!=-1){
                   $scope.teamb.splice($scope.teamb.indexOf(word),1)
                }
                socket.emit("select",{"selected":$scope.selected,"teama":$scope.teama,"teamb":$scope.teamb,"room":$scope.room})
            }
            console.log($scope.selected)
        }
    }
    $scope.again = function(){
        var room=String(Math.floor(Math.random()*9000) + 1000)
        socket.emit('again',[room, $scope.room])
        console.log('again')
        console.log(room)
    };
    
    $scope.reset= function(){
        location.reload()
    }
    
    $scope.group = function(){
        $scope.spy.map(function (v, i) {
            return {
                value1  : v,
                value2  : $scope.words[i]
            };
        }).sort(function (a, b) {
            return ((a.value1 < b.value1) ? -1 : ((a.value1 == b.value1) ? 0 : 1));
        }).forEach(function (v, i) {
            $scope.spy[i] = v.value1;
            $scope.words[i] = v.value2;
        });
        console.log($scope.selected)
    }
    
    socket.on('again', function(room) {
        console.log('ag')
        console.log(room)
        $scope.room=room
        socket.emit('join', room);
        getwords($scope.n, $scope.set, room)
        $scope.selected=[]
    });
    
    socket.on('select', function(s) {
        console.log('selected')
        $scope.selected=s.selected
        $scope.teama=s.teama
        $scope.teamb=s.teamb
        checkwinner()
    });
    
    function checkwinner(d){
        if($scope.teama.length==0){
           $scope.teama="w"
           $scope.teamb="pa"
        }
        else if($scope.teamb.length==0){
           $scope.teamb="w"
           $scope.teama="pa"
        }
    }
    
    $('#confirm-modal').on('hidden.bs.modal', function (e) {
      $scope.last=-1
    })
    
    /*$scope.getClass=function(index){
        console.log(index)
        if ($scope.selected.indexOf(index)!=-1 && $scope.spymaster==true) { return 'bg-success'}
        if($scope.selected.indexOf(index)!=-1 || $scope.spymaster==true){
            if      ($scope.spy[index] == 'a' ) { return ['bg-teama','active']}
            else if ($scope.spy[index] == 'b' ) { return ['bg-teamb','active']}
            else if ($scope.spy[index] == 'n' ) { return ['bg-neutral','active']}
            else if ($scope.spy[index] == 'd' ) { return ['bg-dark','active']}
        }
    }*/
    
    $scope.getClass=function(index, classes){
        console.log(index)
        if ($scope.selected.indexOf(index)!=-1 && $scope.spymaster==true) { return 'bg-success'}
        if($scope.selected.indexOf(index)!=-1 || $scope.spymaster==true){
            if      ($scope.spy[index] == 'a' ) { return ['bg-teama','active']}
            else if ($scope.spy[index] == 'b' ) { return ['bg-teamb','active']}
            else if ($scope.spy[index] == 'n' ) { return ['bg-neutral','active']}
            else if ($scope.spy[index] == 'd' ) { return ['bg-dark','active']}
        }
    }
    
    $scope.$watch('set', function (newValue, oldValue, scope) {   
        if (newValue !== oldValue) {
            $("#set-modal").modal('show')
        }
    });
    
});