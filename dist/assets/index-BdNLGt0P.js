(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const e of a)if(e.type==="childList")for(const n of e.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function s(a){const e={};return a.integrity&&(e.integrity=a.integrity),a.referrerPolicy&&(e.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?e.credentials="include":a.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function o(a){if(a.ep)return;a.ep=!0;const e=s(a);fetch(a.href,e)}})();function _(){return _=Object.assign?Object.assign.bind():function(r){for(var t=1;t<arguments.length;t++){var s=arguments[t];for(var o in s)({}).hasOwnProperty.call(s,o)&&(r[o]=s[o])}return r},_.apply(null,arguments)}function P(r){const t=new Uint8Array(r);return window.btoa(String.fromCharCode(...t))}function T(r){const t=window.atob(r),s=t.length,o=new Uint8Array(s);for(let a=0;a<s;a++)o[a]=t.charCodeAt(a);return o.buffer}const R=new Blob([`
      const BIAS = 0x84;
      const CLIP = 32635;
      const encodeTable = [
        0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
        4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
        7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7
      ];
      
      function encodeSample(sample) {
        let sign;
        let exponent;
        let mantissa;
        let muLawSample;
        sign = (sample >> 8) & 0x80;
        if (sign !== 0) sample = -sample;
        sample = sample + BIAS;
        if (sample > CLIP) sample = CLIP;
        exponent = encodeTable[(sample>>7) & 0xFF];
        mantissa = (sample >> (exponent+3)) & 0x0F;
        muLawSample = ~(sign | (exponent << 4) | mantissa);
        
        return muLawSample;
      }
    
      class RawAudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
                    
          this.port.onmessage = ({ data }) => {
            this.buffer = []; // Initialize an empty buffer
            this.bufferSize = data.sampleRate / 4;
            
            if (globalThis.LibSampleRate && sampleRate !== data.sampleRate) {
              globalThis.LibSampleRate.create(1, sampleRate, data.sampleRate).then(resampler => {
                this.resampler = resampler;
              });
            } 
          };
        }
        process(inputs) {
          if (!this.buffer) {
            return true;
          }
          
          const input = inputs[0]; // Get the first input node
          if (input.length > 0) {
            let channelData = input[0]; // Get the first channel's data

            // Resample the audio if necessary
            if (this.resampler) {
              channelData = this.resampler.full(channelData);
            }

            // Add channel data to the buffer
            this.buffer.push(...channelData);
            // Get max volume 
            let sum = 0.0;
            for (let i = 0; i < channelData.length; i++) {
              sum += channelData[i] * channelData[i];
            }
            const maxVolume = Math.sqrt(sum / channelData.length);
            // Check if buffer size has reached or exceeded the threshold
            if (this.buffer.length >= this.bufferSize) {
              const float32Array = new Float32Array(this.buffer)
              let encodedArray = this.format === "ulaw"
                ? new Uint8Array(float32Array.length)
                : new Int16Array(float32Array.length);

              // Iterate through the Float32Array and convert each sample to PCM16
              for (let i = 0; i < float32Array.length; i++) {
                // Clamp the value to the range [-1, 1]
                let sample = Math.max(-1, Math.min(1, float32Array[i]));

                // Scale the sample to the range [-32768, 32767]
                let value = sample < 0 ? sample * 32768 : sample * 32767;
                if (this.format === "ulaw") {
                  value = encodeSample(Math.round(value));
                }

                encodedArray[i] = value;
              }

              // Send the buffered data to the main script
              this.port.postMessage([encodedArray, maxVolume]);

              // Clear the buffer after sending
              this.buffer = [];
            }
          }
          return true; // Continue processing
        }
      }
      registerProcessor("raw-audio-processor", RawAudioProcessor);
  `],{type:"application/javascript"}),O=URL.createObjectURL(R);class b{static async create({sampleRate:t,format:s,preferHeadphonesForIosDevices:o}){let a=null,e=null;try{const i={sampleRate:{ideal:t},echoCancellation:{ideal:!0},noiseSuppression:{ideal:!0}},l=await navigator.mediaDevices.getUserMedia({audio:!0});if(l==null||l.getTracks().forEach(p=>p.stop()),(["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document)&&o){const p=(await window.navigator.mediaDevices.enumerateDevices()).find(g=>g.kind==="audioinput"&&["airpod","headphone","earphone"].find(h=>g.label.toLowerCase().includes(h)));p&&(i.deviceId={ideal:p.deviceId})}const v=navigator.mediaDevices.getSupportedConstraints().sampleRate;a=new window.AudioContext(v?{sampleRate:t}:{});const d=a.createAnalyser();v||await a.audioWorklet.addModule("https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js"),await a.audioWorklet.addModule(O),e=await navigator.mediaDevices.getUserMedia({audio:i});const w=a.createMediaStreamSource(e),m=new AudioWorkletNode(a,"raw-audio-processor");return m.port.postMessage({type:"setFormat",format:s,sampleRate:t}),w.connect(d),d.connect(m),new b(a,d,m,e)}catch(i){var n,c;throw(n=e)==null||n.getTracks().forEach(l=>l.stop()),(c=a)==null||c.close(),i}}constructor(t,s,o,a){this.context=void 0,this.analyser=void 0,this.worklet=void 0,this.inputStream=void 0,this.context=t,this.analyser=s,this.worklet=o,this.inputStream=a}async close(){this.inputStream.getTracks().forEach(t=>t.stop()),await this.context.close()}}const q=new Blob([`
      const decodeTable = [0,132,396,924,1980,4092,8316,16764];
      
      export function decodeSample(muLawSample) {
        let sign;
        let exponent;
        let mantissa;
        let sample;
        muLawSample = ~muLawSample;
        sign = (muLawSample & 0x80);
        exponent = (muLawSample >> 4) & 0x07;
        mantissa = muLawSample & 0x0F;
        sample = decodeTable[exponent] + (mantissa << (exponent+3));
        if (sign !== 0) sample = -sample;

        return sample;
      }
      
      class AudioConcatProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.buffers = []; // Initialize an empty buffer
          this.cursor = 0;
          this.currentBuffer = null;
          this.wasInterrupted = false;
          this.finished = false;
          
          this.port.onmessage = ({ data }) => {
            switch (data.type) {
              case "setFormat":
                this.format = data.format;
                break;
              case "buffer":
                this.wasInterrupted = false;
                this.buffers.push(
                  this.format === "ulaw"
                    ? new Uint8Array(data.buffer)
                    : new Int16Array(data.buffer)
                );
                break;
              case "interrupt":
                this.wasInterrupted = true;
                break;
              case "clearInterrupted":
                if (this.wasInterrupted) {
                  this.wasInterrupted = false;
                  this.buffers = [];
                  this.currentBuffer = null;
                }
            }
          };
        }
        process(_, outputs) {
          let finished = false;
          const output = outputs[0][0];
          for (let i = 0; i < output.length; i++) {
            if (!this.currentBuffer) {
              if (this.buffers.length === 0) {
                finished = true;
                break;
              }
              this.currentBuffer = this.buffers.shift();
              this.cursor = 0;
            }

            let value = this.currentBuffer[this.cursor];
            if (this.format === "ulaw") {
              value = decodeSample(value);
            }
            output[i] = value / 32768;
            this.cursor++;

            if (this.cursor >= this.currentBuffer.length) {
              this.currentBuffer = null;
            }
          }

          if (this.finished !== finished) {
            this.finished = finished;
            this.port.postMessage({ type: "process", finished });
          }

          return true; // Continue processing
        }
      }

      registerProcessor("audio-concat-processor", AudioConcatProcessor);
    `],{type:"application/javascript"}),U=URL.createObjectURL(q);class k{static async create({sampleRate:t,format:s}){let o=null;try{o=new AudioContext({sampleRate:t});const e=o.createAnalyser(),n=o.createGain();n.connect(e),e.connect(o.destination),await o.audioWorklet.addModule(U);const c=new AudioWorkletNode(o,"audio-concat-processor");return c.port.postMessage({type:"setFormat",format:s}),c.connect(n),new k(o,e,n,c)}catch(e){var a;throw(a=o)==null||a.close(),e}}constructor(t,s,o,a){this.context=void 0,this.analyser=void 0,this.gain=void 0,this.worklet=void 0,this.context=t,this.analyser=s,this.gain=o,this.worklet=a}async close(){await this.context.close()}}function x(r){return!!r.type}class S{static async create(t){let s=null;try{var o;const e=(o=t.origin)!=null?o:"wss://api.elevenlabs.io",n=t.signedUrl?t.signedUrl:e+"/v1/convai/conversation?agent_id="+t.agentId,c=["convai"];t.authorization&&c.push(`bearer.${t.authorization}`),s=new WebSocket(n,c);const i=await new Promise((p,g)=>{s.addEventListener("open",()=>{var h;const u={type:"conversation_initiation_client_data"};var A,I,M,D;t.overrides&&(u.conversation_config_override={agent:{prompt:(A=t.overrides.agent)==null?void 0:A.prompt,first_message:(I=t.overrides.agent)==null?void 0:I.firstMessage,language:(M=t.overrides.agent)==null?void 0:M.language},tts:{voice_id:(D=t.overrides.tts)==null?void 0:D.voiceId}}),t.customLlmExtraBody&&(u.custom_llm_extra_body=t.customLlmExtraBody),t.dynamicVariables&&(u.dynamic_variables=t.dynamicVariables),(h=s)==null||h.send(JSON.stringify(u))},{once:!0}),s.addEventListener("error",g),s.addEventListener("close",g),s.addEventListener("message",h=>{const u=JSON.parse(h.data);x(u)&&(u.type==="conversation_initiation_metadata"?p(u.conversation_initiation_metadata_event):console.warn("First received message is not conversation metadata."))},{once:!0})}),{conversation_id:l,agent_output_audio_format:v,user_input_audio_format:d}=i,w=E(d??"pcm_16000"),m=E(v);return new S(s,l,w,m)}catch(e){var a;throw(a=s)==null||a.close(),e}}constructor(t,s,o,a){this.socket=void 0,this.conversationId=void 0,this.inputFormat=void 0,this.outputFormat=void 0,this.socket=t,this.conversationId=s,this.inputFormat=o,this.outputFormat=a}close(){this.socket.close()}sendMessage(t){this.socket.send(JSON.stringify(t))}}function E(r){const[t,s]=r.split("_");if(!["pcm","ulaw"].includes(t))throw new Error(`Invalid format: ${r}`);const o=parseInt(s);if(isNaN(o))throw new Error(`Invalid sample rate: ${s}`);return{format:t,sampleRate:o}}const N={clientTools:{}},W={onConnect:()=>{},onDebug:()=>{},onDisconnect:()=>{},onError:()=>{},onMessage:()=>{},onModeChange:()=>{},onStatusChange:()=>{},onCanSendFeedbackChange:()=>{}};class C{static async startSession(t){const s=_({},N,W,t);s.onStatusChange({status:"connecting"}),s.onCanSendFeedbackChange({canSendFeedback:!1});let o=null,a=null,e=null;try{return a=await S.create(t),[o,e]=await Promise.all([b.create(_({},a.inputFormat,{preferHeadphonesForIosDevices:t.preferHeadphonesForIosDevices})),k.create(a.outputFormat)]),new C(s,a,o,e)}catch(l){var n,c,i;throw s.onStatusChange({status:"disconnected"}),(n=a)==null||n.close(),await((c=o)==null?void 0:c.close()),await((i=e)==null?void 0:i.close()),l}}constructor(t,s,o,a){var e=this;this.options=void 0,this.connection=void 0,this.input=void 0,this.output=void 0,this.lastInterruptTimestamp=0,this.mode="listening",this.status="connecting",this.inputFrequencyData=void 0,this.outputFrequencyData=void 0,this.volume=1,this.currentEventId=1,this.lastFeedbackEventId=1,this.canSendFeedback=!1,this.endSession=async function(){e.status==="connected"&&(e.updateStatus("disconnecting"),e.connection.close(),await e.input.close(),await e.output.close(),e.updateStatus("disconnected"))},this.updateMode=n=>{n!==this.mode&&(this.mode=n,this.options.onModeChange({mode:n}))},this.updateStatus=n=>{n!==this.status&&(this.status=n,this.options.onStatusChange({status:n}))},this.updateCanSendFeedback=()=>{const n=this.currentEventId!==this.lastFeedbackEventId;this.canSendFeedback!==n&&(this.canSendFeedback=n,this.options.onCanSendFeedbackChange({canSendFeedback:n}))},this.onEvent=async function(n){try{const i=JSON.parse(n.data);if(!x(i))return;switch(i.type){case"interruption":i.interruption_event&&(e.lastInterruptTimestamp=i.interruption_event.event_id),e.fadeOutAudio();break;case"agent_response":e.options.onMessage({source:"ai",message:i.agent_response_event.agent_response});break;case"user_transcript":e.options.onMessage({source:"user",message:i.user_transcription_event.user_transcript});break;case"internal_tentative_agent_response":e.options.onDebug({type:"tentative_agent_response",response:i.tentative_agent_response_internal_event.tentative_agent_response});break;case"client_tool_call":if(e.options.clientTools.hasOwnProperty(i.client_tool_call.tool_name)){try{var c;const l=(c=await e.options.clientTools[i.client_tool_call.tool_name](i.client_tool_call.parameters))!=null?c:"Client tool execution successful.";e.connection.sendMessage({type:"client_tool_result",tool_call_id:i.client_tool_call.tool_call_id,result:l,is_error:!1})}catch(l){e.onError("Client tool execution failed with following error: "+(l==null?void 0:l.message),{clientToolName:i.client_tool_call.tool_name}),e.connection.sendMessage({type:"client_tool_result",tool_call_id:i.client_tool_call.tool_call_id,result:"Client tool execution failed: "+(l==null?void 0:l.message),is_error:!0})}break}if(e.options.onUnhandledClientToolCall){e.options.onUnhandledClientToolCall(i.client_tool_call);break}e.onError(`Client tool with name ${i.client_tool_call.tool_name} is not defined on client`,{clientToolName:i.client_tool_call.tool_name}),e.connection.sendMessage({type:"client_tool_result",tool_call_id:i.client_tool_call.tool_call_id,result:`Client tool with name ${i.client_tool_call.tool_name} is not defined on client`,is_error:!0});break;case"audio":e.lastInterruptTimestamp<=i.audio_event.event_id&&(e.addAudioBase64Chunk(i.audio_event.audio_base_64),e.currentEventId=i.audio_event.event_id,e.updateCanSendFeedback(),e.updateMode("speaking"));break;case"ping":e.connection.sendMessage({type:"pong",event_id:i.ping_event.event_id});break;default:e.options.onDebug(i)}}catch{return void e.onError("Failed to parse event data",{event:n})}},this.onInputWorkletMessage=n=>{this.status==="connected"&&this.connection.sendMessage({user_audio_chunk:P(n.data[0].buffer)})},this.onOutputWorkletMessage=({data:n})=>{n.type==="process"&&this.updateMode(n.finished?"listening":"speaking")},this.addAudioBase64Chunk=async function(n){e.output.gain.gain.value=e.volume,e.output.worklet.port.postMessage({type:"clearInterrupted"}),e.output.worklet.port.postMessage({type:"buffer",buffer:T(n)})},this.fadeOutAudio=async function(){e.updateMode("listening"),e.output.worklet.port.postMessage({type:"interrupt"}),e.output.gain.gain.exponentialRampToValueAtTime(1e-4,e.output.context.currentTime+2),setTimeout(()=>{e.output.gain.gain.value=e.volume,e.output.worklet.port.postMessage({type:"clearInterrupted"})},2e3)},this.onError=(n,c)=>{console.error(n,c),this.options.onError(n,c)},this.calculateVolume=n=>{if(n.length===0)return 0;let c=0;for(let i=0;i<n.length;i++)c+=n[i]/255;return c/=n.length,c<0?0:c>1?1:c},this.getId=()=>this.connection.conversationId,this.setVolume=({volume:n})=>{this.volume=n},this.getInputByteFrequencyData=()=>(this.inputFrequencyData!=null||(this.inputFrequencyData=new Uint8Array(this.input.analyser.frequencyBinCount)),this.input.analyser.getByteFrequencyData(this.inputFrequencyData),this.inputFrequencyData),this.getOutputByteFrequencyData=()=>(this.outputFrequencyData!=null||(this.outputFrequencyData=new Uint8Array(this.output.analyser.frequencyBinCount)),this.output.analyser.getByteFrequencyData(this.outputFrequencyData),this.outputFrequencyData),this.getInputVolume=()=>this.calculateVolume(this.getInputByteFrequencyData()),this.getOutputVolume=()=>this.calculateVolume(this.getOutputByteFrequencyData()),this.sendFeedback=n=>{this.canSendFeedback?(this.connection.sendMessage({type:"feedback",score:n?"like":"dislike",event_id:this.currentEventId}),this.lastFeedbackEventId=this.currentEventId,this.updateCanSendFeedback()):console.warn(this.lastFeedbackEventId===0?"Cannot send feedback: the conversation has not started yet.":"Cannot send feedback: feedback has already been sent for the current response.")},this.options=t,this.connection=s,this.input=o,this.output=a,this.options.onConnect({conversationId:s.conversationId}),this.connection.socket.addEventListener("message",n=>{this.onEvent(n)}),this.connection.socket.addEventListener("error",n=>{this.updateStatus("disconnected"),this.onError("Socket error",n)}),this.connection.socket.addEventListener("close",()=>{this.updateStatus("disconnected"),this.options.onDisconnect()}),this.input.worklet.port.onmessage=this.onInputWorkletMessage,this.output.worklet.port.onmessage=this.onOutputWorkletMessage,this.updateStatus("connected")}}const V={micButton1:"PsNR98dYRFTCCDJvkRPS",micButton2:"13pq2n4EeeB2PT9BHToH",micButton3:"h34yZ6JHAm21OnqDDSrK",micButton4:"8szkeWelAsBhASldWoAj",micButton5:"yro50dPZ55sBrJfsJ0kd"},j=document.querySelectorAll(".mic-button"),B=document.getElementById("termsModal"),$=document.getElementById("agreeButton"),z=document.getElementById("connectionStatus"),J=document.getElementById("agentStatus");let y={},F={},L=!1;$.addEventListener("click",()=>{B.classList.remove("active"),L=!0});j.forEach(r=>{r.addEventListener("click",async t=>{if(!L){B.classList.add("active");return}const s=t.currentTarget.id;r.classList.add("disabled"),F[s]?await G(s):await H(s),r.classList.remove("disabled")})});async function H(r){try{await navigator.mediaDevices.getUserMedia({audio:!0});const t=V[r];if(!t){console.error(`Agent ID not found for button: ${r}`);return}console.log(`Starting session for ${r} (Agent: ${t})`),y[r]=await C.startSession({agentId:t,onConnect:()=>f(r,"connected","listening"),onDisconnect:()=>f(r,"disconnected","idle"),onError:s=>{console.error(`Error for ${r}:`,s),f(r,"disconnected","error")},onModeChange:s=>f(r,"connected",s.mode)}),F[r]=!0}catch(t){console.error(`Failed to start conversation for ${r}:`,t),f(r,"disconnected","error")}}async function G(r){y[r]&&(await y[r].endSession(),y[r]=null,f(r,"disconnected","idle"),F[r]=!1)}function f(r,t,s){z.textContent=t==="connected"?"Connected":"Disconnected",J.textContent=s}
