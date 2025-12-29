#!/usr/bin/env python3
"""
Script para resolver conflictos de Git manteniendo la versión HEAD
"""
import sys

def resolve_conflicts(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    resolved_lines = []
    in_conflict = False
    keep_section = False
    
    for line in lines:
        if line.startswith('<<<<<<<'):
            in_conflict = True
            keep_section = True
            continue
        elif line.startswith('======='):
            keep_section = False
            continue
        elif line.startswith('>>>>>>>'):
            in_conflict = False
            keep_section = False
            continue
        
        if not in_conflict or keep_section:
            resolved_lines.append(line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(resolved_lines)
    
    print(f"✅ Conflictos resueltos en {file_path}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Uso: python resolve_conflicts.py <archivo>")
        sys.exit(1)
    
    resolve_conflicts(sys.argv[1])
