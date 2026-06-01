      const allowedTags ={
        p:true,
        br:true,
        b:true,
        i:true,
        em:true,
        strong:true,
        code:true,
        pre:true,
        ul:true,
        ol:true,
        li:true,
        a:true,
        blockquote:true,
    }
export function sanitiseHTML(rawHtml) {
    const container=document.createElement("div")
    container.innerHTML=rawHtml
    sanitiseNode(container)
return container.innerHTML
}
export function sanitiseNode(node){
     const children=Array.from(node.childNodes)
for (let i=0;i<children.length;i++){
        const currentChild=children[i]
        if (currentChild.nodeType===Node.TEXT_NODE) continue
        if (currentChild.nodeType===Node.ELEMENT_NODE){
            const tag = currentChild.tagName.toLowerCase()
        if (tag==='a'){
            const href=currentChild.getAttribute('href')
            if (href!==null){
                const cleanHref=href.trim().toLowerCase()
              if (cleanHref.startsWith("http://") || cleanHref.startsWith("https://")) {
                currentChild.setAttribute("target","_blank")
                currentChild.setAttribute("rel", "noopener noreferrer")
            } else {
                currentChild.removeAttribute("href")
            }
        }
        }
if (!allowedTags[tag]) {
    node.removeChild(currentChild)
} else {
    sanitiseNode(currentChild)
}
        }
}
}
