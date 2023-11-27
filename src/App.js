import React, {useEffect, useMemo, useState} from 'react'
import classes from './App.module.css'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import './sliderOverrides.css'


const forecastOptions = [
	{id: 'lowmid', text: 'Low/Mid', url: 'isl_skyjahula2', sMin: 1, sMax: 66, class: classes['lowmid-image']},
	{id: 'aurora', text: 'Aurora', url: '', sMin: 1, sMax: 12, class: classes['aurora-image']},
	{id: 'low', text: 'Low', url: 'harmonie_island_lcc', sMin: 1, sMax: 66, class: classes['low-image']},
	{id: 'mid', text: 'Mid', url: 'harmonie_island_mcc', sMin: 1, sMax: 66, class: classes['mid-image']},
	{id: 'high', text: 'High', url: 'harmonie_island_hcc', sMin: 1, sMax: 66, class: classes['high-image']}
]

const addHours = (d,h=1) => d && new Date(new Date(d).setHours(d.getHours()+h))
const addMinutes = (d,m=1) => d && new Date(new Date(d).setMinutes(d.getMinutes()+m))
const sliderToMinutes = s => 5*s
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

const getForecastImage = (d, slider=1, type='lowmid') => {
	if(!d){return ''}

	if(type==='aurora'){
		d = addMinutes(d,sliderToMinutes(slider-12)) //this is assuming a 60 minute Forecast Lead Time
		if(!d){return ''}
		let url = `https://services.swpc.noaa.gov/images/animations/ovation/north`
		url += `/aurora_N_${d.getFullYear().toString()}-${d.getMonth()+1}-${d.getDate()}_${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}.jpg`
		return url
	} else {
		let url = `https://en.vedur.is/photos`
		url += `/${forecastOptions.find(fo=>fo.id===type)?.url}`
		url += `/${d.getFullYear().toString().slice(2)}${d.getMonth()+1}${d.getDate()}_${d.getHours().toString().padStart(2,'0')}00_${slider}.png`
		return url
	}
}

const preloadImages = (ft, d) => {
	const fo = forecastOptions.find(fo=>fo.id===ft)
	for(let i=fo.sMin; i<fo.sMax; i++){
		loadImage(getForecastImage(d,i,fo.id))
	}
}

const determineCloudForecastStart = () => {
	let attempts = 20
	const checkDate = d => (
		loadImage(getForecastImage(d,1,'lowmid'))
		.then(()=>{
			console.log(`Start date is: ${d.toString()}`)
			return d
		})
		.catch(()=>{
			attempts = attempts - 1
			if(attempts>0){
				return Promise.resolve(checkDate(addHours(d,-1)))
			} else {
				const error = 'Couldnt find working image!'
				console.log(error)
				return Promise.reject(error)
			}
		})
	)

	let date = new Date()
	date.setMinutes(0,0,0)
	return checkDate(date)
}

const determineAuroraForecastStart = () => {
	let date = new Date()
	const mins = date.getMinutes()
	const roundToFiveMins = Math.round(mins/5-1)*5
	date.setMinutes(roundToFiveMins,0,0)
	return new Date(date)
}

const App = () => {
	const [cloudForecastStart, setCloudForecastStart] = useState()
	const [status, setStatus] = useState('loading')
	const [forecastSlider, setForecastSlider] = useState(1)
	const [forecastType, setForecastType] = useState('lowmid')

	useEffect(()=>{forecastType==='aurora' && setForecastSlider(1)},[forecastType])

	const sliderMin = forecastOptions.find(fo=>fo.id===forecastType)?.sMin
	const sliderMax = forecastOptions.find(fo=>fo.id===forecastType)?.sMax

	const auroraStart = determineAuroraForecastStart()
	const forecastStart = forecastType==='aurora' ? auroraStart : cloudForecastStart

	useEffect(()=>{
		if((forecastType!=='aurora' && cloudForecastStart) || forecastType==='aurora'){
			preloadImages(forecastType, forecastStart)
		}
	},[cloudForecastStart,forecastType])

	useEffect(()=>{
		if(!cloudForecastStart){
			determineCloudForecastStart()
			.then(fs=>{
				setCloudForecastStart(fs)
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
		if(window.refreshToUpdate === true){location.reload()} //reload page if there are any updates
	}

	const formatDateText = d => d && `${getDayName(d)} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`

	const marks = useMemo(() => {
		if(!forecastStart){return {}}
		let marks = {}
		for(let i=sliderMin; i<sliderMax; i++){
			const addMark = label => {marks[i] = {label,style: {color: "white"}}}
			if(forecastType==='aurora'){
				const checkedDate = addMinutes(forecastStart,sliderToMinutes(i))
				if(checkedDate.getMinutes()%15===0){
					addMark(`${checkedDate.getHours()}:${checkedDate.getMinutes().toString().padStart(2,'0')}`)
				}
			} else {
				const checkedDate = addHours(forecastStart,i)
				if(checkedDate.getHours()===0){
					addMark(getDayName(checkedDate))
				}
			}
		}
		return marks
	},[forecastStart,sliderMin,sliderMax,forecastType])

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
						{formatDateText(forecastType==='aurora' ? addMinutes(forecastStart,sliderToMinutes(forecastSlider)) : addHours(forecastStart,forecastSlider))}
					</div>
				</div>
			</div>
			<div className={classes['image-container']}>
				{status === 'loading' && <div className={classes['text']}>Loading...</div>}
				{status === 'error' && <div className={classes['text']}>Error!</div>}
				{status === 'ok' && (
					<img
						className={`${classes['image']} ${forecastOptions.find(fo=>fo.id===forecastType)?.class}`}
						src={getForecastImage(forecastStart,forecastSlider,forecastType)}
					/>
				)}
			</div>
			<div className={classes['slider-container']}>
				<Slider
					className={classes['slider']}
					min={sliderMin}
					max={sliderMax}
					value={forecastSlider}
					onChange={setForecastSlider}
					marks={marks}
				/>
			</div>
		</div>
	)
}

export default App
