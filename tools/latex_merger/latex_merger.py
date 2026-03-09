import os
import re
import zipfile
import tempfile

class TexMerger:
    def __init__(self):
        # 匹配 \input{} 或 \include{}
        self.input_re = re.compile(r'\\(?:input|include)\{([^}]+)\}')
        # 匹配 LaTeX 注释 (排除被转义的百分号 \%)
        self.comment_re = re.compile(r'(?<!\\)%.*') 
        self.ignore_commands = [
            'usepackage',
            'balance',
            'bibliographystyle',
            'bibliography',
            'sisetup'
            'IEEEoverridecommandlockouts',
            'overrideIEEEmargins',
            'IEEEpubid',
            'pagestyle',
            'thispagestyle',
        ]

        # 动态构建正则表达式以匹配忽略列表中的命令
        # 匹配逻辑：\ + 命令名 + 可选的* + 任意数量的可选参数[...] + 任意数量的必选参数{...}
        if self.ignore_commands:
            cmd_pattern = '|'.join(self.ignore_commands)
            regex_str = rf'\\(?:{cmd_pattern})\*?(?:\[[^\]]*\])*(?:\{{[^{{}}]*\}})*'
            self.ignore_re = re.compile(regex_str)
        else:
            self.ignore_re = None

    def merge_zip(self, zip_path, output_path):
        with tempfile.TemporaryDirectory() as temp_dir:
            # 1. 解压文件
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # 2. 寻找主文件
            root_file = self._find_root_file(temp_dir)
            if not root_file:
                raise ValueError("未能在工程中找到包含 \\documentclass 的主文件。")
            
            # 3. 递归合并与清理
            merged_content = self._recursive_merge(root_file, temp_dir)
            
            # 4. 写入输出
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(merged_content)

    def _find_root_file(self, base_dir):
        tex_files = []
        for root, _, files in os.walk(base_dir):
            for f in files:
                if f.endswith('.tex'):
                    tex_files.append(os.path.join(root, f))

        potential_roots = []
        all_imports = set()

        for file_path in tex_files:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # 去除注释后再寻找 imports
                content_no_comments = self.comment_re.sub('', content)
                imports = self.input_re.findall(content_no_comments)
                for imp in imports:
                    name = imp.strip()
                    if not name.endswith('.tex'): 
                        name += '.tex'
                    all_imports.add(os.path.basename(name))
                
                # 检查是否包含 documentclass
                if r'\documentclass' in content_no_comments:
                    potential_roots.append(file_path)

        # 过滤掉被引用的文件，剩下的即为 Root
        for root in potential_roots:
            if os.path.basename(root) not in all_imports:
                return root
        
        return potential_roots[0] if potential_roots else None

    def _recursive_merge(self, file_path, base_dir):
        # 处理缺省后缀的情况
        if not os.path.exists(file_path):
            if not file_path.endswith('.tex'):
                file_path += '.tex'
        
        # 如果文件依然不存在，返回空字符串
        if not os.path.exists(file_path):
            return ""

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()

        processed_lines = []
        for line in lines:
            # 1. 清除注释
            clean_line = self.comment_re.sub('', line)
            
            # 2. 清除目标忽略命令
            if self.ignore_re:
                clean_line = self.ignore_re.sub('', clean_line)
            
            # 3. 判断是否为空行
            if not clean_line.strip():
                continue
                
            # 4. 检查是否包含 \input 或 \include
            match = self.input_re.search(clean_line)
            if match:
                child_name = match.group(1).strip()
                child_path = os.path.join(os.path.dirname(file_path), child_name)
                
                # 递归获取子文件内容
                child_content = self._recursive_merge(child_path, base_dir)
                replaced_line = clean_line.replace(match.group(0), child_content)
                
                # 替换后再次检查是否为空行（应对子文件全为空或全被过滤的情况）
                if replaced_line.strip():
                    processed_lines.append(replaced_line)
            else:
                # 统一换行符
                processed_lines.append(clean_line.rstrip() + '\n')

        return "".join(processed_lines)

if __name__ == "__main__":
    # 你可以在实例化时传入自定义列表，如果不传则使用类内置的默认列表
    merger = TexMerger()
    
    zip_path = "/home/zlz/awesome-ai-research-writing-web/test/test_latex.zip"
    output_path = "/home/zlz/awesome-ai-research-writing-web/test/merged_output.tex"
    
    merger.merge_zip(zip_path, output_path)
    
    # 状态输出移至类外
    print(f"合并完成！已生成文件: {output_path}")