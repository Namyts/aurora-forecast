import React, {useEffect, useMemo, useState} from 'react'
import classes from './App.module.css'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './sliderOverrides.css'


const forecastOptions = [
	{id: 'lowmid', text: 'Low/Mid', url: 'isl_skyjahula2'},
	{id: 'low', text: 'Low', url: 'harmonie_island_lcc'},
	{id: 'mid', text: 'Mid', url: 'harmonie_island_mcc'},
	{id: 'high', text: 'High', url: 'harmonie_island_hcc'}
]

const addHours = (d,forecastSlider=1) => d && new Date(new Date(d).setHours(d.getHours() + forecastSlider))
const getDayName = d => {
	const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
	return d && weekday[d.getDay()]
}

const loadImage = url => new Promise((resolve,reject)=>{
	const img = new Image()
	img.onload = resolve
	img.onerror = reject
	img.src = url
})

const getForecastImage = (d, slider=1, type='lowmid', caller) => {
	if(!d){return ''}
	let url = `https://en.vedur.is/photos/`

	url += forecastOptions.find(fo=>fo.id===type)?.url
	url += `/${d.getFullYear().toString().slice(2)}${d.getMonth()+1}${d.getDate()}_${d.getHours().toString().padStart(2,'0')}00_${slider}.png`

	return url
}

const preloadImages = (d, min, max) => {
	forecastOptions.forEach(fo=>{
		for(let i=min; i<max; i++){
			loadImage(getForecastImage(d,i,fo.id,'pi'))
		}
	})
}

const determineForecastStart = () => {
	let attempts = 20
	const checkDate = d => (
		loadImage(getForecastImage(d,1,undefined,'determine'))
		.then(()=>{
			console.log(`Start date is: ${d.toString()}`)
			return d
		})
		.catch(()=>{
			attempts = attempts - 1
			if(attempts>0){
				return Promise.resolve(checkDate(addHours(d,-1)))
			} else {
				return Promise.reject('Couldnt find working image!')
			}
		})
	)

	let date = new Date()
	date.setMinutes(0,0,0)
	return checkDate(date)
}

const App = () => {

	const sliderMin = 1
	const sliderMax = 66

	const [forecastStart, setForecastStart] = useState()
	const [status, setStatus] = useState('loading')
	const [forecastSlider, setForecastSlider] = useState(1)
	const [forecastType, setForecastType] = useState('lowmid')

	useEffect(()=>forecastStart && preloadImages(forecastStart,sliderMin,sliderMax),[forecastStart])
	useEffect(()=>{
		if(!forecastStart){
			determineForecastStart()
			.then(fs=>{
				setForecastStart(fs)
				setStatus('ok')
			})
			.catch(()=>setStatus('error'))
		}
	},[])

	const cycleForecastType = () => {
		const types = forecastOptions.map(fo=>fo.id)
		const fi  = types.indexOf(forecastType)
		const nfi = (fi + 1) % types.length
		setForecastType(types[nfi])
	}

	const formatDateText = d => d && `${getDayName(d)} ${d.getHours()}:00`

	const marks = useMemo(() => {
		if(!forecastStart){return {}}
		let marks = {}
		for(let i=sliderMin; i<sliderMax; i++){
			const checkedDate = addHours(forecastStart,i)
			if(checkedDate.getHours()===0){
				marks[i] = {
					label: getDayName(checkedDate),
					style: {color: "white"}
				}
			}
		}
		return marks
	},[forecastStart,sliderMin,sliderMax])

	return (
		<div className={classes['container']}>
			<div className={classes['header']}>
				<div className={classes['menu']} onClick={cycleForecastType}>
					<div className={classes['text']}>
						🔁{forecastOptions.find(fo=>fo.id===forecastType)?.text}
					</div>
				</div>
				<div className={classes['date']}>
					<div className={classes['text']}>
						{formatDateText(addHours(forecastStart,forecastSlider))}
					</div>
				</div>
			</div>
			<div className={classes['image-container']}>
				{status === 'loading' && <div className={classes['text']}>Loading...</div>}
				{status === 'error' && <div className={classes['text']}>Error!</div>}
				{status === 'ok' && (
					<img
						className={classes['image']}
						src={getForecastImage(forecastStart,forecastSlider,forecastType,'img')}
					/>
				)}
			</div>
			<div className={classes['slider-container']}>
				<Slider
					className={classes['slider']}
					min={sliderMin}
					max={sliderMax}
					onChange={setForecastSlider}
					marks={marks}
				/>
			</div>
		</div>
	)
}

export default App
