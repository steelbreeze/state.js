/**
 * Created by y50-70 on 2015/12/30.
 */



namespace StateJS{
    export namespace myStateJS{
        
        export interface Configure {
            states:Array<State>,
            events?:any,
            callbacks?:any
        }


        export interface State{
            name:string,
            kind?:PseudoStateKind,
            regions?:Regions
        }

        export interface Regions{
        [index:string]:Array<State>

        }

        export interface CallBack{
            
        }
        export interface Events{
            name:string,
            from:string,
            to:string
        }
    }
    
}