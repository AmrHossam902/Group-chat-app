
import Orchestractor  from "../utilities/orchestartor";




test("firing single event with a single handler", ()=>{
    let result = 0; 
    let o = new Orchestractor();
    o.on("addEvent", (a, b)=>{
        result = a+b;
    });

    o.emit("addEvent", 2, 3);
    expect(result).toEqual(5); 
});


it("firing single event with 2 handlers", ()=>{
    let result = []; 
    let o = new Orchestractor();

    o.on("EventA", (a)=>{
        result.push(a);
    });

    o.on("EventA", (b, c)=>{
        result.push(b,c);
    });

    o.emit("EventA","car", "taxi");
    expect(result).toEqual(["car", "car", "taxi"]);

});


test("firing an event that has no handler", ()=>{

    let result = []; 
    let o = new Orchestractor();

    o.on("EventA", (a)=>{
        result.push(a);
    });

    o.emit("EventB", "fired");
    
    //expect result to be empty
    expect(result).toEqual([]);



}) 


