$("#save").click(save);

function save(){
    var date = new Date;
    localStorage.setItem('myChip',JSON.stringify(window.myChip))
    localStorage.setItem('time',date);
    $("#prompt-saved").show().delay(2000).fadeOut();
}

$('#load').click(load);

function load(){
    var myChip = JSON.parse(localStorage.getItem('myChip'));
    if (myChip === null) {
        $("#no-data").show().delay(2000).fadeOut();
        
        
    }
else{
    //load necessary assets
    window.myChip.I = myChip.I;
    window.myChip.V = myChip.V;
    window.myChip.delay = myChip.delay;
    window.myChip.drawFlag = myChip.drawFlag;
    window.myChip.gfx = myChip.gfx;
    window.myChip.keys = myChip.keys;
    window.myChip.memory = myChip.memory;
    window.myChip.opcode = myChip.opcode;
    window.myChip.pc = myChip.pc;
    window.myChip.sound = myChip.sound;
    window.myChip.stack = myChip.stack;
    window.myChip.sp = myChip.sp;
    //refresh the screen and debugger
    window.myChip.draw();
    window.myChip.updateTableRegister();
    window.myChip.updateTableMemory();

    $("#saved-data").text("Loaded data from " + localStorage.getItem('time'));
    $("#saved-data").show().delay(2000).fadeOut();

}
}