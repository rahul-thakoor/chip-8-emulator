//use javascript constructor function to create a chip8 object

var chrono;
function Chip8() {

    //program counter
    var pc;
    //opcode
    var opcode;
    //index counter
    var I;
    //stack
    var stack;
    //stack pointer
    var sp;
    //registers
    var V;
    //memory
    var memory;
    //keys
    var keys;
    //keymap
    var keymap;
    //state of chip-8
    var running;
    //fontset
    var fontset;
    //drawFlag
    var drawFlag;
    //array for representing sprites to display
    var gfx;
    //screen settings
    var canvas;
    var context;
    //timers
    var sound;
    var delay;
}

//a method to initialize the Chip8
Chip8.prototype.init = function() {
    //create a 4096 KB memory
    this.memory = new Uint8Array(4096);
    //create registers, the chip-8 has 16 and set to zero
    this.V = new Uint8Array(16);
    // we need to implement a stack with 16 levels and set to zero
    this.stack = [];
    /*for(i=0; i<this.stack.length; i++){
        this.stack[i]=0;
    }*/
    //set stack pointer to 0
    this.sp = 0;
    //set index to 0
    this.I = 0;
    //initialize program counter to 0x200 since the system expects the 
    // application to be loaded at location 0x200;
    this.pc = 0x200;
    //reset opcode
    this.opcode = 0;
    //array to store current key state
    this.keys = [];
    //keymap
    this.keymap = {
            "1": 0x1,  // 1
            "2": 0x2,  // 2
            "3": 0x3,  // 3
            "4": 0xC,  // C
            "q": 0x4,  // 4
            "w": 0x5,  // W
            "e": 0x6,  // D
            "r": 0xD,  // R
            "a": 0x7,  // A
            "s": 0x8,  // S
            "d": 0x9,  // D
            "f": 0xE,  // F
            "z": 0xA,  // Z
            "x": 0x0,  // X
            "c": 0xB,  // C
            "v": 0xF  // V
  }
  this.fontset = [
    //source : http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
  ];
  //load font in memory --based on Cowgod's Chip-8 Technical Reference
  //The data should be stored in the interpreter area of Chip-8 memory (0x000 to 0x1FF)
  for(var i = 0; i < this.fontset.length; i++) {
    this.memory[i] = this.fontset[i];
  }

  //set drawFlag to false
  this.drawFlag = false;

  //display array --> 64 * 32
  this.gfx = new Array(32);
  for(i=0; i<32; i++){
      this.gfx[i] = new Array(64);
      for(j=0;j<64;j++){
          this.gfx[i][j]=0;
      }
  }

    //state
    this.running = false;
    //screen parameters
    this.canvas = document.getElementById('screen');
    this.context = this.canvas.getContext("2d");
    this.clearScreen();

    //set timers to zero
    this.delay =0;
    this.sound =0;

    console.log("initialized");
    

}

//load program
Chip8.prototype.loadProgram = function(prog) {
        //start filling memory as from 0x200
        for (i = 0; i < prog.length; i++) {
            this.memory[0x200 + i] = prog[i];
        }
        this.updateTableMemory();
        this.updateTableRegister();
    };


// emulate cycle
Chip8.prototype.emulateCycle = function() {
    
    this.fetchCode();
    

    //after merging the 2 bytes, and getting the opcode, we need to decode it
    //Decode and execute
    this.decode_execute();

    //draw if needed
    if(this.drawFlag === true){
        this.draw();
        this.drawFlag = false;
    }


    //debug
    this.updateTableRegister();
    this.updateTableMemory();
    //this.updateTableStack();

    //update timers
    if(this.delay > 0){
        this.delay--;
        console.log("BEEEP!!!")
    }

    if(this.sound > 0){
        this.sound --;
    }


  //  console.log(this);
  


}

//function to fetch opcode
Chip8.prototype.fetchCode = function(){
    /*fetch code at location specified by the program counter (pc)
    since each opcode is 2 bytes longs, we get to successive bytes
    we then merge them by shifting first part by 8 bits, then adding(Bitwise OR) the next byte*/
    this.opcode = (this.memory[this.pc]) << 8 | this.memory[this.pc + 1];
    //console.log(this.opcode.toString(16));
}

//function to decode the opcode
Chip8.prototype.decode_execute = function (){
    
    //extracting operands:
    //12-bit address is in form NNN
    var addr = this.opcode & 0x0FFF;
    
    //byte operand (8-bit constant)
    var b_operand = this.opcode & 0x00FF;

    //nibble
    var n_operand = this.opcode & 0x000F;

    // x and y --> we need to get 4-bit register value
    var x = (this.opcode & 0x0F00) >> 8;
    var y = (this.opcode & 0x00F0) >> 4;

    this.pc += 2;

    switch(this.opcode & 0xF000 ){
        //reading first nibble

        

        case 0x0000:

            switch (b_operand){
                case 0x00E0:
                //00E0 : clears the screen
                this.clearScreen();
                
                break;

                case 0x00EE:
                
                //00EE: returns from subroutine;
                //set pc to value at top of stack
                this.pc = this.stack[--this.sp];
                
                break;    
            }
            break;
            

        case 0x1000:
       
        //1NNN: jumps to addr NNN
        this.pc = addr;
       
        break;    

            
        case 0x2000:
        //2NNN: call subroutine at NNN
        //before jump store current pc to stack
        this.stack[this.sp] = this.pc
        //increment the sp to prevent overwriting of current stack
        this.sp ++;
        //set pc to addr NNN
        this.pc = addr;
        // no need to increment pc
        
        break;


        case 0x3000:
        //3XNN : skips next instruction of VX = NN
        if(this.V[x] == b_operand){
            this.pc += 2; //skips next instr
        }
        break;

        case 0x4000:
        //4XNN : skips next instruction of VX != NN
        if(this.V[x] != b_operand){
            this.pc += 2; //skips next instr
        }
        
        break;

        case 0x5000:
        //5XY0 : Skips the next instruction if VX equals VY.
        if(this.V[x] == this.V[y]){
            this.pc += 2;
        }
        
        break;

        case 0x6000:
        //6XNN
        //we need to set Vx = NN
        this.V[x] = b_operand;
      
        break;

        case 0x7000:
        //7XNN
        //Adds NN to VX.
        this.V[x] += b_operand;
        
        break;

        case 0x8000:
            //another switch
            switch (n_operand) {
                case 0x0000:
                    //8XY0 : stores the value of VY in VX
                    this.V[x] = this.V[y];
                    
                    break;

                case 0x0001:
                    //8XY1 stores the value of (VX OR VY) in VX
                    this.V[x] = ((this.V[x])|(this.V[y]));
                    
                    break;

                case 0x0002:
                    //8XY2 stores the value of (VX AND VY) in VX
                    this.V[x] = ((this.V[x])&(this.V[y]));
                    
                    break;

                case 0x0003:
                    //8XY3 stores the value of (VX XOR VY) in VX
                    this.V[x] = ((this.V[x])^(this.V[y]));
                    
                    break;

                case 0x0004:
                    //8XY4  stores the value of (VX +VY) in VX and 
                    //sets VF to 1 if there is a carry or to ) if there is no carry
                    var sum = this.V[x] + this.V[y];
                    //check if sum is greater than 8 bit(2^8 =255)
                    if(sum > 255){
                        this.V[x] = (sum & 0x00FF);
                        this.V[15] = 1;
                    }
                    else{
                        this.V[x] = sum;
                        this.V[15] = 0;
                    }
                    
                    break;
                
                case 0x0005:
                    //8XY5 stores the value of (VX-VY) in VX and sets VF to 1 if VX is greater than VY, else it is set to 0
                    if(this.V[x] > this.V[y]){
                        this.V[15] = 1;
                    }
                    else{
                        this.V[15] = 0;
                    }
                    this.V[x] = this.V[x] - this.V[y];
                    
                    break;

                case 0x0006:
                    //8XY6 sets VF to 1 if least significant bit of Vx is 1 else to 0. Then VX is divided by 2
                    this.V[15] = this.V[x] & 0x01;
                    //shift by 1 to right implies divide by 2
                    this.V[x] = this.V[x] >> 1;
                    
                    break;

                case 0x0007:
                    //8XY7 stores the value of (VY-VX) in VX and sets VF to 1 if VY is greater than VX, else it is set to 0
                    if(this.V[y] > this.V[x]){
                        this.V[15] = 1;
                    }
                    else{
                        this.V[15] = 0;
                    }
                    this.V[x] = this.V[y] - this.V[x];
                    
                    break;

                case 0x000E:
                    //8XYE sets VF to 1 if most significant bit of x is 1 else to 0. Then VX is multiplied by 2
                    this.V[15] = this.V[x] & 0x80;
                    //left shift by 1 implies multiplication by 2;
                    this.V[x] = this.V[x] << 1;
                    
                    break;

            }   
            break;
            
        case 0x9000:
        //9XY0 : Skips the next instruction if VX doesn't equal VY
        if(this.V[x] != this.V[y]){
            this.pc += 2;
        }
       
        break;

        case 0xA000:
        //ANNN : Sets I to the address NNN
        this.I = addr;
        
        break;

        case 0xB000:
        //BNNN : Jumps to the address NNN plus V0
        this.pc = addr + this.V[0];
        break;

        case 0xC000:
        //CXNN : Sets VX to the result of a bitwise AND 
        //operation on a random number (Typically: 0 to 255) and NN
        var rand_num = Math.floor(Math.random() * 254); //get a random integer between 0 - 255
        this.V[x] = rand_num & b_operand;
        
        break;

        case 0xD000:
        var chip = this;
        var gfx = this.gfx;
       // console.log("drawing being set");
        //DXYN : Draws a sprite at coordinate (VX, VY) that has 
        //a width of 8 pixels and a height of N pixels
        //Each row of 8 pixels is read as bit-coded starting from memory location I; 
        //I value doesn’t change after the execution of this instruction.

        //Register V[f] is used for collision detection
        chip.V[0xF] = 0; //reset VF

        //get the coordinates X and Y
        var col_coord = chip.V[x];
        var row_coord = chip.V[y];
    

        //get pixel height N
        var height = n_operand;

        //get pixels to draw
        var pixel=[];
        
        //loop over each row
        for (var row =0; row< height; row++){
            //fetch pixel value from memory starting at location I
            pixel.push(chip.memory[chip.I +row ]);
        }
        function logBIN(element){
           // console.log(element.toString(2));
        }
        //pixel.forEach(logBIN);
        
        for (var row =0; row< height; row++){
           // console.log(pixel[row]);
               for(var column =0; column<8; column++){
                   var bytePixel = pixel[row];
                   if((bytePixel & (0x80 >> column))!=0){
                       //we need to set a pixel to 1
                      // console.log('need to set a bit: row ' + row + ", column " + column );
                       //first check if corresponding pixel on display is already set
                    //    console.log("row_c00rd :" + row_coord + " column_coord " + col_coord);
                    //    console.log(chip.gfx[row_coord + row][col_coord + column]);
                    
                       if(gfx[row_coord + row][col_coord + column] ^ 1 == 0){
                           //collision detected
                           chip.V[0xF] =1;
                           console.log("collision detected");
                           //set the pixel using XOR
                           gfx[row_coord + row][col_coord + column] =0;
                        }
                        else {
                            gfx[row_coord + row][col_coord + column] =1;
                        }
                   }
               };
        }
        
         //we need to draw to screen
        chip.drawFlag = true;
        
        break; //draw ends

        case 0xE000:
            switch(b_operand){
                case 0x009E:
                //EX9E : Skips the next instruction if the key stored in VX is pressed
                if(this.keys[this.V[x]] == true){
                    this.pc += 2;
                }
                
                break;

                case 0x00A1:
                //EXA1 : Skips the next instruction if the key stored in VX isn't pressed
                if(this.keys[this.V[x]] == false){
                    this.pc += 2;
                }
                
                break;

            }
            break;

        case 0xF000:
            switch(b_operand){
                case 0x0007:
                //FX07 : Sets VX to the value of the delay timer
                this.V[x] = this.delay;
                
                break;

                case 0x000A:
                //FX0A : A key press is awaited, and then stored in VX. 
                //(Blocking Operation. All instruction halted until next key event)
                
                //get key pressed
                this.running= false;
                var chip = this;
                
                
                $(document).one("keypress",function(event){
                    //console.log(event.keyCode);
                    key = chip.keymap[event.key];
                    console.log(key)
                    if(typeof key !=='undefined'){
                        document.dispatchEvent(new CustomEvent(chip.setVx(x,key)));
                        chip.running = true;
                    }
                });
                
                
                
                
                break;

                case 0x0015:
                //FX15: sets the delay timer to VX
                this.delay = this.V[x];
                
                break;

                case 0x0018:
                //FX18: sets the sound timer to VX
                this.sound = this.V[x];
                
                break;

                case 0x001E:
                //FX1E: adds Vx to I
                this.I += this.V[x]; 
                
                break;

                case 0x0029:
                //FX29: Sets I to the location of the sprite for the character in VX.
                //we stored the fontset in memory starting at 0x000 to 0x04F
                //the sprites are represented by 5 rows
                this.I = this.V[x] * 5;//if Vx contains 0 --> 0, 1 -->5 ,etc
                
                break;

                case 0x0033:
                //FX33: Stores the binary-coded decimal representation of VX, 
                //with the most significant of three digits at the address in I, 
                //the middle digit at I plus 1, and the least significant digit at I plus 2.
                var number = this.V[x], I;
                //console.log(number);

                         for (i = 3; i > 0; i--) {
                             this.memory[this.I + i - 1] = parseInt(number % 10);
                             number /= 10;
                         }
                
                break;

                case 0x0055:
                //FX55: Stores V0 to VX (including VX) in memory starting at address I
                for (var i = 0; i <= x; i++) {
                             this.memory[this.I + i] = this.V[i];
                         }
                
                break;

                case 0x0065:
                //FX65: Fills V0 to VX (including VX) with values from memory starting at address I.
                for (var i = 0; i <= x; i++) {
                             this.V[i]= this.memory[this.I + i];
                         }
                
                break;

            }
            break;



    } //switch ends here
}

Chip8.prototype.updateTableRegister = function(){
    var c = 0;
    while(c < 16){
        var hex = c.toString(16);
        var hexData = (this.V[c]).toString(16);
        $("#row"+c+"col2").empty();
        $("#row"+c+"col2").append("  #"+hexData);
        c = c + 1;
    }
}

Chip8.prototype.updateTableMemory = function(){
    //updating active row
    var hex = (this.pc).toString(16);
    var hexData = (this.memory[this.pc]).toString(16);
    $("#mrow6col1").empty();
    $("#mrow6col1").append(hex+"  -");
    $("#mrow6col2").empty();
    $("#mrow6col2").append("#"+hexData);
    for (i = 0; i < 6; i++) { 
        //updating rows after active one
        var hex = ((this.pc)+i).toString(16);
        var hexData = (this.memory[(this.pc)+i]).toString(16);
        $("#mrow"+(6+i)+"col1").empty();
        $("#mrow"+(6+i)+"col1").append(hex+"  -");
        $("#mrow"+(6+i)+"col2").empty();
        $("#mrow"+(6+i)+"col2").append("#"+hexData);

        //updating rows before active one
        var hex = ((this.pc)-i).toString(16);
        var hexData = (this.memory[(this.pc)-i]).toString(16);
        $("#mrow"+(6-i)+"col1").empty();
        $("#mrow"+(6-i)+"col1").append(hex+"  -");
        $("#mrow"+(6-i)+"col2").empty();
        $("#mrow"+(6-i)+"col2").append("#"+hexData);
    }

}

Chip8.prototype.updateTableStack = function(){
     for (i = 0; i < 16; i++) { 
        var hexData = (this.stack[i]).toString(16);
       // console.log(hexData);
        $("#0row"+i+"col2").empty();
        $("#0row"+i+"col2").append("#"+hexData);
     }
}


Chip8.prototype.draw = function(){
    this.context.strokeStyle = 'black';
    //we traverse the display array, then draw rect where cells are 1
    for(i=0; i<this.gfx.length; i++){
        for(j=0; j<this.gfx[i].length; j++){
            if(this.gfx[i][j] == 1){
                this.context.fillStyle = 'blue';
                this.context.strokeRect(j*10,i *10, 10, 10);
                this.context.fillRect(j*10,i *10, 9, 9);    
            }
            else{
                this.context.fillStyle = 'black';
                this.context.strokeRect(j*10,i *10, 10, 10);
                this.context.fillRect(j*10,i *10, 9, 9); 
            }

        }
    }
    
}

Chip8.prototype.clearScreen = function(){
    for(i=0; i<this.gfx.length; i++){
                    for(j=0;j<this.gfx[i].length; j++){
                        this.gfx[i][j] = 0;
                    }
                };
    this.context.clearRect(0,0,640,320);
    
};

Chip8.prototype.run = function(){
    this.running = true;
    var self = this;
    console.log(self)
    requestAnimationFrame(function process() {
        if(self.running === true){
             self.emulateCycle();
        }
            

             requestAnimationFrame(process);

         });

};

Chip8.prototype.stop = function(){
    this.running = false;
}

Chip8.prototype.setKey = function(key){
    this.keys[key] = true;
   // console.log(this.keys);
}

Chip8.prototype.unsetKey = function(key){
    this.keys[key] = false;
   // console.log(this.keys);
}

Chip8.prototype.setVx =  function(x,key){
    this.V[x] = key;
    console.log("setting key "+key+ " at register " + x);
}



var myChip = new Chip8;
myChip.init();

//console.log(myChip);


//emulates one cycle of the cpu when "step" button clicked
$("#step").click(function() {
    myChip.emulateCycle();
});

//emulates running of the cpu at 60Hz when "run" button clicked


$("#run").click(function(){
    myChip.run();
});

//stop the CPU cycle
$("#stop").click(function(){
    myChip.stop();
});

//check if key is pressed
$(document).on('keypress',function(event){
    
    var key = myChip.keymap[event.key];
    //console.log(event.key);
    if(typeof key !== 'undefined'){
        
        document.dispatchEvent(new CustomEvent(myChip.setKey(key)));
        
    }
    
});

$(document).on('keyup',function(event){
    
    var key = myChip.keymap[event.key];
   // console.log(event.key);
    if(typeof key !== 'undefined'){
        
        document.dispatchEvent(new CustomEvent(myChip.unsetKey(key)));
        
    }
    
});


$('#memory').on('click',function(){
    myChip.stop();

    memor = ''
    for(i=myChip.memory.length-1;i>=0; i--){
        memor = memor+ ' ' + myChip.memory[i].toString(16).toUpperCase();

    }
    
    $('#modal-memory').modal('show');
    $('#memory-view').text(memor);
    $('#modal-memory-ok').on('click',function(){
        $('#modal-memory').modal('hide');
       

    })
    
})