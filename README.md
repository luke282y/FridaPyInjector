# FridaPyInjector <img src=https://frida.re/img/logotype.svg width=100 height=20/> + <img src=https://www.python.org/static/img/python-logo.png width=150 height=30 />
Python class and Frida javascript that will inject a python interpreter into a running process on Windows. A python script can then be executed from the injected process. Utilizes [frida python bindings](https://github.com/frida/frida-python) and [Python/C API](https://docs.python.org/3/c-api/index.html). Idea based on [Pymem](https://github.com/srounet/Pymem).

# Requirements
  - Python > 3.5 -> https://www.python.org
  - Frida -> https://frida.re/

# Install
Install python 3.x on a windows host and pip install frida.

# Usage
``` python
import pathlib
from fridaPyInjector import pyinject  

#inject python interpreter into notepad.exe
#notepad.exe must be running already
pi = pyinject("notepad.exe")
python_file = "test.py"
#use full path
file_path = Path(__file__).parent / python_file
#execute python script test.py from filename
pi.run_file(file_path.resolve())
```