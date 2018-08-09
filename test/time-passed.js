const timePassed = async seconds => new Promise(resolve => setTimeout(resolve, seconds))

module.exports = timePassed
