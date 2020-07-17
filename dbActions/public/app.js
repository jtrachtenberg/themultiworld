const Create = document.querySelector('.Create')
Create.addEventListener('submit', (e) => {
    e.preventDefault()
    const item1 = Create.querySelector('.item1').value
    const item2 = Create.querySelector('.item2').value
    post('/create', {item1,item2})
})

function post (path, data) {
    return window.fetch(path, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}