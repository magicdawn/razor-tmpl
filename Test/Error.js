

var $result='';
for(var i =0;i<10;i++){
    var getRandomColor = function(){
    return 'rgb({0},{1},{2})'.format(Math.random()*255,Math.random()*255,Math.random()*255);
    }

    $result+='<div style=\"background-color:';
    
    $result+=getRandomColor();
    $result+=';\">这是第';
    
    $result+=i;
    $result+='个</div>';
}

return $result;