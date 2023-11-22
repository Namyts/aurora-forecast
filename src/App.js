import React, {useEffect, useState} from 'react'
import classes from './App.module.css'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './sliderOverrides.css'

const sliderMin = 1
const sliderMax = 66

const getStartDate = () => {
	let date = new Date()
	const currentHours = date.getHours()
	const detectionHours = [18,12,6,0]
	const websiteUpdateTime = 2
	const detectionHour = detectionHours.find(dh=>currentHours-websiteUpdateTime>=dh)
	date.setHours(detectionHour)
	date.setMinutes(0)
	date.setSeconds(0)
	date.setMilliseconds(0)
	return date
}

const getCurrentDate = (forecastSlider=1) => {
	const d = getStartDate()
	d.setHours(d.getHours() + forecastSlider)
	return d
}


const forecastOptions = {
	lowmid: 'Low/Mid',
	low: 'Low',
	mid: 'Mid',
	high: 'High'
}

const getForecastImage = (slider, type) => {
	let url = `https://en.vedur.is/photos/`
	switch(type){
		case 'lowmid': url+="isl_skyjahula2"; break
		case 'low': url+="harmonie_island_lcc"; break
		case 'mid': url+="harmonie_island_mcc"; break
		case 'high': url+="harmonie_island_hcc"; break
		default: url+="isl_skyjahula2"; break
	}

	const d = getStartDate()

	url += `/${d.getFullYear().toString().slice(2)}${d.getMonth()+1}${d.getDate()}_${d.getHours().toString().padStart(2,'0')}00_${slider}.png`

	// console.log(d)
	// console.log(url)
	// console.log("https://en.vedur.is/photos/isl_skyjahula2/231121_1200_1.png")
	return url
}

const getDayName = d => {
	const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
	return weekday[d.getDay()]
}

const formatDate = d => `${getDayName(d)} ${d.getHours()}:00`

const getMarks = () => {
	let marks = []
	for(let i=sliderMin; i<sliderMax; i++){
		if(getCurrentDate(i).getHours()===0){
			marks.push([i,getDayName(getCurrentDate(i))])
		}
	}
	const style = {color: "white"}
	return Object.fromEntries(marks.map(m=>[m[0],{style, label:m[1]}]))
}

const preloadImages = () => {
	Object.keys(forecastOptions).forEach(fo=>{
		for(let i=sliderMin; i<sliderMax; i++){
			const img = new Image()
			img.src = getForecastImage(i,fo)
		}
	})
}

const App = () => {

	const cycleForecastType = () => {
		const fi  = Object.keys(forecastOptions).indexOf(forecastType)
		const nfi = (fi + 1) % Object.keys(forecastOptions).length
		setForecastType(Object.keys(forecastOptions)[nfi])
	}

	const [forecastSlider, setForecastSlider] = useState(1)
	const [forecastType, setForecastType] = useState('lowmid')

	useEffect(()=>preloadImages(),[])

	return (
		<div className={classes['container']}>
			<div className={classes['header']}>
				<div className={classes['menu']} onClick={cycleForecastType}>
					<div className={classes['text']}>🔁{forecastOptions[forecastType]}</div>
				</div>
				<div className={classes['date']}>
				<div className={classes['text']}>{formatDate(getCurrentDate(forecastSlider))}</div>
				</div>
			</div>
			<div className={classes['image-container']} >
				<img className={classes['image']} src={getForecastImage(forecastSlider, forecastType)}/>
			</div>
			<div className={classes['slider-container']}>
				<Slider className={classes['slider']} min={sliderMin} max={sliderMax} onChange={setForecastSlider} marks={getMarks()}/>
			</div>
		</div>
	)
}

export default App
