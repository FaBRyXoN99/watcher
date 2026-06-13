import os
import re

directory = r'c:\Users\fabri\Box\Antigravity\Watcher\src\components\icons'
for filename in os.listdir(directory):
    if not filename.endswith('.jsx'): continue
    path = os.path.join(directory, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'useEffect' not in content:
        content = re.sub(r'import React, \{(.*?)\} from \'react\';', r"import React, {\1, useEffect } from 'react';", content)

    if 'divRef' in content: continue

    hook_insertion = '''    const divRef = useRef(null);

    useEffect(() => {
      const parent = divRef.current?.parentElement;
      if (!parent) return;

      const handleEnter = () => { if (!isControlledRef.current) controls.start("animate"); };
      const handleLeave = () => { if (!isControlledRef.current) controls.start("normal"); };
      const handleClick = () => { 
        if (!isControlledRef.current) {
          controls.start("normal").then(() => controls.start("animate"));
        } 
      };

      parent.addEventListener('mouseenter', handleEnter);
      parent.addEventListener('mouseleave', handleLeave);
      parent.addEventListener('click', handleClick);

      return () => {
        parent.removeEventListener('mouseenter', handleEnter);
        parent.removeEventListener('mouseleave', handleLeave);
        parent.removeEventListener('click', handleClick);
      };
    }, [controls]);
'''
    content = content.replace('const isControlledRef = useRef(false);', 'const isControlledRef = useRef(false);\n' + hook_insertion)
    
    content = content.replace('<div\n', '<div\n        ref={divRef}\n', 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Done!')
