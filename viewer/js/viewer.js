
;(() => {
  window.addEventListener('load', () => {
    const url = new URL(window.location)
    if (url.searchParams.has('tx')) {
      // Display a metanet node
      displayMetanetNode(url.searchParams.get('tx'))
    } else {
      // Show home page
      document.querySelector('#repos').style.display = 'block'

      document.querySelector('#featured-tab').addEventListener('click', () => {
        document.querySelector('#featured-tab').classList.add('tab-selected')
        document.querySelector('#recent-tab').classList.remove('tab-selected')
        displayFeatured()
      })

      document.querySelector('#recent-tab').addEventListener('click', () => {
        document.querySelector('#recent-tab').classList.add('tab-selected')
        document.querySelector('#featured-tab').classList.remove('tab-selected')
        displayRepos()
      })

      displayFeatured()
    }
  })
  
  async function displayFeatured() {
    const featuredTransactions = [
      '73fc317c548676f5c082c9381fbbcbd64cbfb7d0838c15b5964dd5dabb53e50a',
      'a508bb614add6a66ba14b05794c9ae98afb34675a26d591dced88221c5ca4d03'
    ]
    displayRepos(featuredTransactions)
  }

  /**
   * Find recent 'bsvpush.json' files and return the parents which are the repos.
   * If repos is specified then filters by those parent txids.
   */
  async function displayRepos(repos) {
    const query = {
      "q": {
          "limit": 50,
          "find": {
              "out.s8": 'bsvpush.json'
          },
          "project": {
              "node": 1,
              "out": 1,
              "out.s4": 1,
              "out.s5": 1,
              "out.s8": 1,
              "parent": 1
          }
      }
    }

    if (repos) {
      query.q.find['parent.tx'] = {
        "$in": repos
      }
    }

    const b64 = btoa(JSON.stringify(query))
    const url = "https://metanaria.planaria.network/q/" + b64
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } })
    const json = await response.json()
    
    const nodes = []

    for (const metanet of json.metanet) { 
      const bsvpushJson = JSON.parse(metanet.out[0].s5)
      metanetNode = {
        nodeTxId: metanet.parent.tx,
        nodeKey: metanet.parent.a,
        name: bsvpushJson.name,
        description: bsvpushJson.description,
        sponsor: bsvpushJson.sponsor
      }
      nodes.push(metanetNode)
    }

    const tbody = document.querySelector('.repos-table tbody')
    // Remove all rows
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild)
    }
    const rowTemplate = document.querySelector('#repo-row')
    nodes.forEach(node => {
      let row = document.importNode(rowTemplate.content, true)
      row.querySelector('.name a').textContent = node.name
      row.querySelector('.name a').setAttribute('href', '?tx=' + node.nodeTxId)
      row.querySelector('.description').textContent = node.description
      tbody.appendChild(row)

      // Create a moneybutton, use tr:last-child as moneybutton needs an element, whereas row is a DocumentFragment
      const moneyButtonDiv = tbody.querySelector('tr:last-child #node-money-button')
      const defaults = {
        amount: "1",
        currency: "USD",
        label: "Tip",
        clientIdentifier: "3fb24dea420791729b4d9b39703c6339",
        buttonId: node.nodeTxId,
        buttonData: "{}",
        type: "tip"
      }
      moneyButton.render(moneyButtonDiv, Object.assign(defaults, node.sponsor))
    })
  }

  async function displayMetanetNode(txid) {
    const metanetNode = await getMetanetNode(txid)
    console.log(`Metanet Node public key: ${metanetNode.nodeKey}`)
    const children = await getChildNodes(metanetNode.nodeTxId)
    // sort children
    children.sort((a, b) => a.name < b.name ? -1 : 1)

    document.querySelector('#metanet-node').style.display = 'block'

    document.querySelector('span#node-name').innerHTML = metanetNode.name
    document.querySelector('span#node-txid').innerHTML = metanetNode.nodeTxId
    document.querySelector('span#node-publickey').innerHTML = metanetNode.nodeKey

    if (metanetNode.parentTxId) {
      document.querySelector('a#parent-back').setAttribute('href', '?tx=' + metanetNode.parentTxId)
      document.querySelector('a#parent-back').style.display = 'inline'
    }

    document.querySelector('#clone input').value = `bsvpush clone ${metanetNode.nodeTxId}`

    const tbody = document.querySelector('.children-table tbody')
    const rowTemplate = document.querySelector('#node-row')

    children.forEach(child => {
      const row = document.importNode(rowTemplate.content, true)
      row.querySelector('.name a').textContent = child.name
      row.querySelector('.name a').setAttribute('href', '?tx=' + child.nodeTxId)
      row.querySelector('.txid').textContent = child.nodeTxId
      tbody.appendChild(row)
    })
    
    if (children.length === 0) {
      document.querySelector('.children-table').style.display = 'none'
    }

    document.querySelector('#metanet-node').style.display = 'block'

    // Check for readme.md and display
    const readme = children.find(c => c.name.toLowerCase() == 'readme.md')
    if (readme) {
      // Get the readme data
      const md = await getFileData(readme.nodeTxId)
      showdown.setFlavor('github')
      const converter = new showdown.Converter()
      document.querySelector('#readme').innerHTML = converter.makeHtml(md)
      document.querySelector('#readme').style.display = 'block'
    }

    // Check for bsvpush.json
    const bsvpushData = children.find(c => c.name.toLowerCase() == 'bsvpush.json')
    if (bsvpushData) {
      // Get the json file
      const json = await getFileData(bsvpushData.nodeTxId)
      const data = JSON.parse(json)
      if (data.sponsor) {
        // Create a moneybutton
        const moneyButtonDiv = document.querySelector('#node-money-button')
        const defaults = {
          amount: "1",
          currency: "USD",
          label: "Tip",
          clientIdentifier: "3fb24dea420791729b4d9b39703c6339",
          buttonId: metanetNode.nodeTxId,
          buttonData: "{}",
          type: "tip",
          editable: true
        }
        moneyButton.render(moneyButtonDiv, Object.assign(defaults, data.sponsor))
      }
    }

    // If this is a B:// file then get the data and display it
    if (metanetNode.nodeType == '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut') {
      const fileData = await getFileData(metanetNode.nodeTxId)
      const textNode = document.createTextNode(fileData)
      document.querySelector('pre#text').appendChild(textNode)
      document.querySelector('div#file-data').style.display = 'block'
      hljs.highlightBlock(document.querySelector('div#file-data'));
    }

    document.querySelector('#spinner').style.display = 'none'
  }

  const metanetApiUrl = 'https://codeonchain.network'
  const bFileType = '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'

  /**
   * Creates an object representing a metanet node from a transaction.
   * Will interpret B files.
   * @param {*} txid 
   * @returns {txid, publicKey, parentTx, type, data, mediaType, encoding, name, parts}
   */
  async function getMetanetNode(txid) {
    //return (await (await fetch(metanetApiUrl + '/tx/' + txid)).json())

    const query = {
      "q": {
          "find": {
              "node.tx": txid
          },
          "project": {
              "node": 1,
              "out": 1,
              "out.s4": 1,
              "out.s8": 1,
              "parent": 1
          }
      }
    }

    const b64 = btoa(JSON.stringify(query))
    const url = "https://metanaria.planaria.network/q/" + b64
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } })
    const json = await response.json()

    let metanetNode = {}

    if (json.metanet.length > 0) { 
      const metanet =  json.metanet[0]
      metanetNode = {
        nodeTxId: txid,
        nodeKey: metanet.node.a,
        nodeType: metanet.out[0].s4,
        name: metanet.out[0].s8,
      }
      if (metanet.out[0].s8) {
        metanetNode.name = metanet.out[0].s8
      } else {
        metanetNode.name = metanet.out[0].s4
      }
      if (metanet.parent) {
        metanetNode.parentTxId = metanet.parent.tx
        metanetNode.parentKey = metanet.parent.a
      }
    }
    return metanetNode;
  };

  async function getChildNodes(txid) {
    //return (await (await fetch(metanetApiUrl + '/tx/' + node_txid + '/children')).json()).children

    const query = {
      "q": {
          "find": {
              "parent.tx": txid
          },
          "project": {
              "node": 1,
              "out": 1,
              "out.s4": 1,
              "out.s8": 1
          }
      }
    }

    const b64 = btoa(JSON.stringify(query))
    const url = "https://metanaria.planaria.network/q/" + b64
    const response = await fetch(url, { headers: { key: '1DzNX2LzKrmoyYVyqMG46LLknzSd7TUYYP' } })
    const json = await response.json()
    
    const children = []

    for (const metanet of json.metanet) { 
      metanetNode = {
        nodeTxId: metanet.node.tx,
        nodeKey: metanet.node.a,
        nodeType: metanet.out[0].s4,
        name: metanet.out[0].s8,
      }
      if (metanet.out[0].s8) {
        metanetNode.name = metanet.out[0].s8
      } else {
        metanetNode.name = metanet.out[0].s4
      }
      children.push(metanetNode)
    }
    return children;
  }

  async function getFileData(txid) {
    const metanetNode = {txid: txid}
    const result = await (await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/hash/${txid}`)).json()

    // Get the opReturn
    const vout = result.vout.find(vout => 'scriptPubKey' in vout && (vout.scriptPubKey.type == 'nulldata' || vout.scriptPubKey.type == 0))
    if (vout) {
      metanetNode.parts = parseOpReturn(vout.scriptPubKey.hex)

      // Verify OP_RETURN
      if (metanetNode.parts[0].toLowerCase() != '6a') throw 'Script of type nulldata is not an OP_RETURN'

      // Verify metanet tag
      if (fromHex(metanetNode.parts[1]) != 'meta') throw 'OP_RETURN is not of type metanet'

      metanetNode.publicKey = fromHex(metanetNode.parts[2])
      metanetNode.parentTx = fromHex(metanetNode.parts[3])
      metanetNode.type = fromHex(metanetNode.parts[4])

      if (metanetNode.type == '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut') {
        // Interpret B file
        metanetNode.data = fromHex(metanetNode.parts[5])
        metanetNode.mediaType = fromHex(metanetNode.parts[6])
        metanetNode.encoding = fromHex(metanetNode.parts[7])
        metanetNode.name = fromHex(metanetNode.parts[8])
      } else {
        metanetNode.name = metanetNode.type
      }
    }
    return metanetNode.data
  }

  // Returns each part as hex string (e.g. 'abcdef')
  function parseOpReturn(hex) {
    let parts = []
    // First part is op return
    parts.push(hex[0] + hex[1])
    let index = 2;
    while (index < hex.length) {
      // Get the length
      let lengthHex = hex[index] + hex[index + 1]
      index += 2
      // Convert length to decimal
      let length = parseInt(lengthHex, 16)
      if (length == 76) {
        // Next 1 byte contains the length
        lengthHex = hex.substring(index, index + 2)
        length = parseInt(lengthHex, 16)
        index += 2
      } else if (length == 77) {
        // Next 2 bytes contains the length, little endian
        lengthHex = ''
        for (let i = 0; i < 2; i++) {
          lengthHex = hex[index + i * 2] + hex[index + i * 2 + 1] + lengthHex
        }
        length = parseInt(lengthHex, 16)
        index += 4
      } else if (length == 78) {
        // Next 4 bytes contains the length, little endian
        lengthHex = ''
        for (let i = 0; i < 4; i++) {
          lengthHex = hex[index + i * 2] + hex[index + i * 2 + 1] + lengthHex
        }
        length = parseInt(lengthHex, 16)
        index += 8
      }

      let data = ''
      // Read in data
      for (let i = 0; i < length; i++) {
        data += hex[index] + hex[index + 1]
        index += 2
      }
      parts.push(data)
    }
    return parts
  }

  function repos() {
    return [
      {
        name: 'bcat-client-video-stream',
        description: 'Play bcat videos in the browser',
        txid: 'a508bb614add6a66ba14b05794c9ae98afb34675a26d591dced88221c5ca4d03',
        tip: 'jolon@moneybutton.com'
      },
      {
        name: 'bsvpush',
        description: 'Push code repositories to BSV',
        txid: '73fc317c548676f5c082c9381fbbcbd64cbfb7d0838c15b5964dd5dabb53e50a',
        tip: 'jolon@moneybutton.com'
      },
    ]
  }

  // https://stackoverflow.com/questions/21647928/javascript-unicode-string-to-hex
  function fromHex(hex){
    let str
    try {
        uriComponent = hex.replace(/(..)/g,'%$1')
        //console.log(`uriComponent`, uriComponent)
        str = decodeURIComponent(uriComponent)
    } catch(e) {
        str = hex
        console.log('invalid hex input: ' + hex)
        console.log(e)
    }
    return str
  }  

  function toHex(str){
    let hexß
    try {
        hex = unescape(encodeURIComponent(str)).split('').map(function(v){
            return v.charCodeAt(0).toString(16)
        }).join('')
    } catch(e) {
        hex = str
        console.log('toHex: Invalid text input: ' + str)
    }
    return hex
  }

})()
