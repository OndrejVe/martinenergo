export async function speakText(text){
  try{
    const r = await fetch('/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    if(!r.ok) throw new Error('TTS selhal');
    const buf = await r.arrayBuffer();
    const blob = new Blob([buf], {type:'audio/mpeg'});
    const url = URL.createObjectURL(blob);
    const audio = document.getElementById('avatar-audio');
    const bubble = document.getElementById('avatar-bubble');
    audio.src = url;
    bubble?.classList.add('talking');
    await audio.play().catch(()=>{ /* autoplay block – necháme na klik */ });
    audio.onended = ()=> bubble?.classList.remove('talking');
  }catch(e){
    console.warn('speakText error', e);
  }
}
