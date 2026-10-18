// Offline shader rendering for reproducible scene thumbnails and social artwork.
// clang -Wno-deprecated-declarations -framework Foundation -framework OpenGL scripts/render-scenes.m -o /tmp/fractal-render
#import <Foundation/Foundation.h>
#import <OpenGL/OpenGL.h>
#import <OpenGL/gl.h>
static GLuint compile(GLenum kind, NSString *source){
 GLuint s=glCreateShader(kind);const char *p=source.UTF8String;glShaderSource(s,1,&p,NULL);glCompileShader(s);GLint ok;glGetShaderiv(s,GL_COMPILE_STATUS,&ok);if(!ok){char log[16384];glGetShaderInfoLog(s,sizeof(log),NULL,log);fprintf(stderr,"%s\n",log);exit(2);}return s;
}
int main(int argc,const char **argv){@autoreleasepool{
 if(argc<3)return 1;
 NSDictionary *input=[NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:@(argv[1])] options:0 error:NULL];
 CGLPixelFormatAttribute attrs[]={kCGLPFAColorSize,24,kCGLPFAAllowOfflineRenderers,(CGLPixelFormatAttribute)0};CGLPixelFormatObj pf;GLint count;CGLContextObj context;
 CGLError err=CGLChoosePixelFormat(attrs,&pf,&count);if(err!=kCGLNoError){fprintf(stderr,"CGL pixel format: %s\n",CGLErrorString(err));return 3;}
 err=CGLCreateContext(pf,NULL,&context);CGLDestroyPixelFormat(pf);if(err!=kCGLNoError){fprintf(stderr,"CGL context: %s\n",CGLErrorString(err));return 3;}CGLSetCurrentContext(context);fprintf(stderr,"Offline OpenGL renderer: %s\n",glGetString(GL_RENDERER));
 GLuint program=0;
 float vertices[]={-1,-1,1,-1,-1,1,-1,1,1,-1,1,1};GLuint buffer;glGenBuffers(1,&buffer);glBindBuffer(GL_ARRAY_BUFFER,buffer);glBufferData(GL_ARRAY_BUFFER,sizeof(vertices),vertices,GL_STATIC_DRAW);glEnableVertexAttribArray(0);glVertexAttribPointer(0,2,GL_FLOAT,GL_FALSE,0,0);
 GLuint fb,texture;glGenFramebuffersEXT(1,&fb);glGenTextures(1,&texture);glBindFramebufferEXT(GL_FRAMEBUFFER_EXT,fb);glBindTexture(GL_TEXTURE_2D,texture);
 for(NSDictionary *scene in input[@"scenes"]){
 if(program)glDeleteProgram(program);program=glCreateProgram();glAttachShader(program,compile(GL_VERTEX_SHADER,input[@"vertex"]));glAttachShader(program,compile(GL_FRAGMENT_SHADER,scene[@"fragment"]));glBindAttribLocation(program,0,"a_position");glLinkProgram(program);GLint linked;glGetProgramiv(program,GL_LINK_STATUS,&linked);if(!linked){char log[16384];glGetProgramInfoLog(program,sizeof(log),NULL,log);fprintf(stderr,"%s\n",log);return 2;}glUseProgram(program);fprintf(stderr,"Rendering %s\n",[scene[@"file"] UTF8String]);
 if(argc>3&&strcmp(argv[3],"--compile-only")==0){fprintf(stderr,"Shader compiled and linked: %s\n",[scene[@"file"] UTF8String]);continue;}
 int w=[scene[@"width"] intValue],h=[scene[@"height"] intValue];glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,w,h,0,GL_RGBA,GL_UNSIGNED_BYTE,NULL);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_NEAREST);glFramebufferTexture2DEXT(GL_FRAMEBUFFER_EXT,GL_COLOR_ATTACHMENT0_EXT,GL_TEXTURE_2D,texture,0);if(glCheckFramebufferStatusEXT(GL_FRAMEBUFFER_EXT)!=GL_FRAMEBUFFER_COMPLETE_EXT)return 4;glViewport(0,0,w,h);
 NSDictionary *uniforms=scene[@"uniforms"];for(NSString *key in uniforms){GLint u=glGetUniformLocation(program,key.UTF8String);id value=uniforms[key];if([value isKindOfClass:[NSArray class]]){NSArray *a=value;if(a.count==2)glUniform2f(u,[a[0] floatValue],[a[1] floatValue]);else if(a.count==3)glUniform3f(u,[a[0] floatValue],[a[1] floatValue],[a[2] floatValue]);else glUniform4f(u,[a[0] floatValue],[a[1] floatValue],[a[2] floatValue],[a[3] floatValue]);}else if([key isEqualToString:@"u_type"]||[key isEqualToString:@"u_iterations"]||[key isEqualToString:@"u_degree"]||[key isEqualToString:@"u_depth"])glUniform1i(u,[value intValue]);else glUniform1f(u,[value floatValue]);}
 glDrawArrays(GL_TRIANGLES,0,6);glFinish();unsigned char *pixels=malloc(w*h*3);glPixelStorei(GL_PACK_ALIGNMENT,1);glReadPixels(0,0,w,h,GL_RGB,GL_UNSIGNED_BYTE,pixels);GLenum e=glGetError();if(e!=GL_NO_ERROR){fprintf(stderr,"GL error %u\n",e);return 5;}
 NSString *file=[@(argv[2]) stringByAppendingPathComponent:[scene[@"file"] stringByAppendingString:@".ppm"]];FILE *out=fopen(file.UTF8String,"wb");if(!out)return 6;fprintf(out,"P6\n%d %d\n255\n",w,h);for(int y=h-1;y>=0;y--)fwrite(pixels+y*w*3,1,w*3,out);fclose(out);free(pixels);printf("Rendered %s\n",scene[@"file"]? [scene[@"file"] UTF8String]:"scene");fflush(stdout);
 }
 CGLDestroyContext(context);return 0;
}}
