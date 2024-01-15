/*
    Frida script to load and utilize python interpreter
    inot an executable.
*/

//global py object intilized by rpc export init
var py = null

//RPC exports used for running script from python
rpc.exports = {
    init: function (py_module_path,syspath) {
        py = new PYTHON(py_module_path,syspath);
        return py.mod;
    },
    runScript: function(script) {
        py.run_script(script);
    },
    runFile: function(path) {
        py.run_file(path);
    }
};

/*
    PYTHON class loads python dll at path specified
    in constructor into executable. Provices javascript
    bindings for python c-api.
*/
class PYTHON {
    constructor(py_module_path,syspath){
        this.py_module_path = py_module_path;
        this.syspath=syspath;
        this.mod = null;
        this.mod = Module.load(this.py_module_path);
        Module.ensureInitialized(this.mod.name);

        //Py_InitializeEx
        this.initialize_ex = new NativeFunction(
            this.mod.getExportByName('Py_InitializeEx'),
            'int',
            ['int']
        );
        //PyRun_SimpleString
        this.run_simple_string = new NativeFunction(
            this.mod.getExportByName('PyRun_SimpleString'),
            'int',
            ['pointer']
        );
        //PyRun_SimpleFile
        this.run_simple_file = new NativeFunction(
            this.mod.getExportByName('PyRun_SimpleFile'),
            'int',
            ['pointer','pointer']
        );
        //Py_BuildValue
        this.build_value = new NativeFunction(
            this.mod.getExportByName('Py_BuildValue'),
            'pointer',
            ['pointer','pointer']
        );
        //_Py_fopen_obj
        this.fopen_obj = new NativeFunction(
            this.mod.getExportByName('_Py_fopen_obj'),
            'pointer',
            ['pointer','pointer']
        );
        //Py_SetProgramName
        this.set_program_name = new NativeFunction(
            this.mod.getExportByName('Py_SetProgramName'),
            'void',
            ['pointer']
        );
        //Py_GetPath
        this.get_path = new NativeFunction(
            this.mod.getExportByName('Py_GetPath'),
            'pointer',
            []
        )
        //Py_SetPath
        this.set_path = new NativeFunction(
            this.mod.getExportByName('Py_SetPath'),
            'void',
            ['pointer']
        )
        //Py_Finalize
        this.finalize = new NativeFunction(
            this.mod.getExportByName('Py_Finalize'),
            'void',
            []
        )
        const path_ptr = Memory.alloc(1024);
        path_ptr.writeUtf16String(this.syspath);
        this.set_path(path_ptr);

        this.initialize_ex(1);      
    };

    //runs ascii text blob in python interpreter
    run_script(script_text){
        var block_size = (Math.floor(script_text.length/4092)+1)*4096;
        const script_ptr = Memory.alloc(block_size);
        Memory.protect(script_ptr,block_size,'rwx');
        script_ptr.writeUtf8String(script_text);
        var ret_val = this.run_simple_string(script_ptr);
        return ret_val;
    }

    //runs file at filepath in python interpreter
    run_file(filepath){
        const path_ptr = Memory.alloc(filepath.length+1);
        path_ptr.writeUtf8String(filepath);

        const format_ptr = Memory.alloc(2);
        format_ptr.writeUtf8String("s");

        const py_path_obj = this.build_value(format_ptr,path_ptr);

        const mode_ptr = Memory.alloc(3);
        mode_ptr.writeUtf8String("r+");

        var fp = this.fopen_obj(py_path_obj,mode_ptr);

        var ret_val = this.run_simple_file(fp,path_ptr);
        return ret_val;
    }

}

