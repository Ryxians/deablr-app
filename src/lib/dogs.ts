/**
 * The four dogs who take turns decorating the site. On every page load each
 * one is dealt to exactly one slot, so no dog shows up twice.
 */
export const DOGS = ["penny", "louie", "rocco", "winston"] as const

/** Each slot reads its dog from these CSS custom properties. */
export const DOG_SLOTS = ["bg", "header", "logo", "footer"] as const

/**
 * Runs inline in <head> before first paint: shuffles the dogs and writes one
 * per slot onto <html> as `--dog-<slot>` (image url) plus `--dog-<slot>-name`
 * (display name, for CSS `content`). Doing it before paint and outside React
 * means no flash of the fallback dogs and no SSR/hydration mismatch.
 */
export const dogShuffleScript = `(function(){
var d=${JSON.stringify(DOGS)},s=${JSON.stringify(DOG_SLOTS)},r=document.documentElement.style;
for(var i=d.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=d[i];d[i]=d[j];d[j]=t}
for(var k=0;k<s.length;k++){r.setProperty("--dog-"+s[k],'url("/'+d[k]+'.svg")');r.setProperty("--dog-"+s[k]+"-name",'"'+d[k].charAt(0).toUpperCase()+d[k].slice(1)+'"')}
})()`
