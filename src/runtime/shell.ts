/**
 * Created by y50-70 on 2015/12/30.
 */




namespace StateJS{
    
    var statements = '';
    
    export var Queue = async.queue(function(task:any, callback:any) {
        console.log('worker is processing task: ', task.name);
        task.run(callback);
    }, 1);

    export function create(cfg:myStateJS.Configure){
        var states = cfg.states || [];
        var events = cfg.events || [];
        var callbacks = cfg.callbacks || {};

        var model = new StateMachine("model");

        parseStateList(states,"model");
        parseTransitions(events,callbacks);
        console.log(statements);
        statements+= 'var instance = new StateJS.StateMachineInstance("p3pp3r");StateJS.initialise(model, instance);';
        eval(statements);
         
    }

    function parseStateList(array_state:Array<myStateJS.State>,parent:string){

        for(var index in array_state){
            parseState(array_state[index],parent);
        }
    }

    function parseState(state:myStateJS.State,parent:string){
        if(state.kind != undefined){
            if(PseudoStateKind.Initial === state.kind){
                concat("var "+state.name+" = new StateJS.PseudoState('"+state.name+"', "+parent+", StateJS.PseudoStateKind.Initial);");  
            }else{

            }
        }else{
             concat("var "+state.name+" = new StateJS.State('"+state.name+"', "+parent+");");
             
        }
        if(state.regions){
            parseRegions(state.regions,state.name);
        }
    }

    function parseRegions(region:myStateJS.Regions,state_name:string){
        for(var pro in region){
            concat("var "+pro+" = new StateJS.Region('"+pro+"', "+state_name+");");
            parseStateList(region[pro],pro);
        }
    }
    
    function parseTransitions(events:Array<myStateJS.Events>,callbacks:any){
        for(let item of events){
            var callback = callbacks[item.name];
            if(callback){
                let statement = item.from+".to("+item.to+")";
                if(callback.when){
                    for(let when_item of callback.when){
                        statement+=".when("+when_item+")"
                    }
                    concat(statement);
                }
            }else{
                concat(item.from+".to("+item.to+");");
            }
        }
    }
    
    function concat(statement:string){
        statements += statement+"\n";
    }
}
