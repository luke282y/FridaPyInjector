'''
    fridapy uses frida to inject a python interpreter
    into a running process. Python scripts can then be executed
    in the process.
'''
import frida
import sys
from pathlib import Path

class pyinject:
    def __init__(self,procname: str) -> None:
        '''
         pyinject class init takes process name as ascii string
        '''
        self.procname = procname
        self.frida_session = None
        self.frida_api = None
        self.python_module_path= None
        self.python_module = None

        self.frida_script_name = "pyinject.js"  
        self._init_frida()
        self._set_python_module()
        self._load_python()

    def _init_frida(self) -> None:
        '''
        creates frida session for specified process and loads
        the pyinject frida javascript
        '''
        self.frida_session = frida.attach(self.procname)
        with open(self.frida_script_name,'r') as fin:
            script_text = fin.read()
        script=self.frida_session.create_script(script_text)
        script.on('message',self._message_handler)
        script.load()
        self.frida_api = script.exports_sync

    def _message_handler(self,message: dict,data) -> None:
        '''
        recieves messages sent from pyinject.js
        '''
        print(message)

    def _set_python_module(self) -> None:
        '''
        gets currently running python interpreter path and gets the 
        coresponding python dll that will be injecteted into the target
        process
        '''
        python_path = Path(sys.executable)
        python_dll = f"python{sys.version_info.major}{sys.version_info.minor}.dll"
        self.python_module_path = python_path.parent / python_dll
        if(not self.python_module_path.is_file()):
            raise(f"Python module not found: {self.python_module_path}")

    def _load_python(self) -> None:
        '''
        calls the pyinject.js init export to inject the python interpreter
        '''
        syspath = ';'.join(sys.path)
        self.python_module = self.frida_api.init(str(self.python_module_path),syspath)

    def run_script(self,script_text):
        '''
        calls the pyinject.js run_script export to execute an ascii string script
        '''
        self.frida_api.run_script(script_text)
    
    def run_file(self,file_path):
        '''
        calls the pyinject.js run_file export to execute python script at specified path
        '''
        self.frida_api.run_file(str(file_path))

#Example usage
if __name__=="__main__":
    #inject python interpreter into notepad.exe
    pi = pyinject("notepad.exe")
    python_file = "test.py"
    #use full path
    file_path = Path(__file__).parent / python_file
    #execute python script test.py
    pi.run_file(file_path.resolve())