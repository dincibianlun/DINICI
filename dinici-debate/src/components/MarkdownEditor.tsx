import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

interface MarkdownEditorProps {
  initialValue: string;
  height?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  onImageUpload?: (blob: Blob, callback: (url: string, altText: string) => void) => Promise<void>;
}

export interface MarkdownEditorRef {
  getContent: () => string;
  getInstance: () => any;
  setContent: (content: string) => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>((props, ref) => {
  const { initialValue, height = '400px', onChange, placeholder = '请输入内容...', onImageUpload } = props;
  const editorRef = useRef<any>(null);

  // 将内部方法暴露给父组件
  useImperativeHandle(ref, () => ({
    getContent: () => {
      if (editorRef.current) {
        try {
          return editorRef.current.getInstance().getMarkdown() || '';
        } catch (error) {
          console.error('获取编辑器内容失败:', error);
          return '';
        }
      }
      return '';
    },
    getInstance: () => {
      if (editorRef.current) {
        try {
          return editorRef.current.getInstance();
        } catch (error) {
          console.error('获取编辑器实例失败:', error);
          return null;
        }
      }
      return null;
    },
    setContent: (content: string) => {
      if (editorRef.current) {
        try {
          editorRef.current.getInstance().setMarkdown(content);
        } catch (error) {
          console.error('设置编辑器内容失败:', error);
        }
      }
    }
  }));

  // 监听内容变化
  useEffect(() => {
    if (editorRef.current && onChange) {
      const editorInstance = editorRef.current.getInstance();
      
      // 添加内容变化监听
      const handleChange = () => {
        try {
          const content = editorInstance.getMarkdown();
          onChange(content);
        } catch (error) {
          console.error('处理内容变化失败:', error);
        }
      };

      editorInstance.on('change', handleChange);
      
      // 清理函数
      return () => {
        try {
          editorInstance.off('change', handleChange);
        } catch (error) {
          console.error('清理编辑器事件监听失败:', error);
        }
      };
    }
  }, [onChange]);

  return (
    <div className="markdown-editor-wrapper">
      <Editor
        ref={editorRef}
        initialValue={initialValue}
        previewStyle="tab"
        height={height}
        initialEditType="markdown"
        useCommandShortcut={true}
        placeholder={placeholder}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ]}
        hooks={{
          // @ts-ignore
          addImageBlobHook: async (blob: Blob, callback: (url: string, altText: string) => void) => {
            if (onImageUpload) {
              try {
                await onImageUpload(blob, callback);
              } catch (error) {
                console.error('图片上传失败:', error);
              }
            } else {
              // 默认实现 - 创建本地URL (不推荐用于生产)
              const url = URL.createObjectURL(blob);
              callback(url, 'image');
            }
          }
        }}
      />
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;