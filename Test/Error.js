func
function func(ViewBag) {
    var result = [];
    for (var i in ViewBag.persons) { var p = ViewBag.persons[i]; var isAdult = p.age >= 18; if (isAdult) { console.log(p); result.push('<div>'); result.push(p.name); result.push('是成人了啊~~~</div> <div>不和谐内容</div>'); } result.push('else {'); while (p.age > 0) { p.age--; result.push('<div>'); result.push(p.age); result.push('</div>'); } result.push('<div>少儿不宜啊...</div> }'); } return result.join('');
}