import RSVP from 'rsvp';

export default function injectScript(src, async = true, text) {
  return new RSVP.Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    if (src) {
      script.src = src;
    }
    if (text) {
      script.text = text;
    }
    script.async = async;
    script.onload = resolve;
    script.onerror = reject;
    document.getElementsByTagName('head')[0].appendChild(script);
  });
}
