import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TextInput, TouchableOpacity, Image } from 'react-native';
import * as Location from 'expo-location';

const openWeatherKey = 'ffe27fe0c6391c65ae1f8e0b5ea508c2'; // Your OpenWeatherMap API key
let url = 'https://api.openweathermap.org/data/2.5/weather';

const Weather = () => {
    const [forecast, setForecast] = useState(null);
    const [locationDetails, setLocationDetails] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false); // New loading state

    const loadForecast = async (lat, lon) => {
        setRefreshing(true);
        try {
            let fullUrl = `${url}?lat=${lat}&lon=${lon}&units=metric&appid=${openWeatherKey}`;
            const response = await fetch(fullUrl);
            const data = await response.json();

            console.log(response.status); // Log the response status code
            console.log(data); // Log the fetched data

            if (!response.ok) {
                Alert.alert('Something Went Wrong');
            } else {
                setForecast(data); // Set the fetched data to the state
            }
        } catch (error) {
            console.error(error);
            Alert.alert('An error occurred'); // Handle network or fetch errors
        }
        setRefreshing(false);
    };

    const loadCurrentLocationWeather = async () => {
        // Request permission to access location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }

        // Get the current location with higher accuracy
        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
            enableHighAccuracy: true,
        });

        await loadForecast(location.coords.latitude, location.coords.longitude);

        // Reverse geocoding to get the specific location name
        const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (geocode.length > 0) {
            setLocationDetails(geocode[0]); // Set location details
        }
    };

    const searchWeatherByCity = async () => {
        if (searchQuery.trim()) {
            setLoading(true); // Start loading when search is initiated
            try {
                let fullUrl = `${url}?q=${searchQuery}&units=metric&appid=${openWeatherKey}`;
                const response = await fetch(fullUrl);
                const data = await response.json();

                if (!response.ok) {
                    Alert.alert('City not found');
                } else {
                    setForecast(data);
                    setLocationDetails(null); // Clear current location details
                }
            } catch (error) {
                console.error(error);
                Alert.alert('An error occurred while searching');
            } finally {
                setLoading(false); // Stop loading regardless of success or failure
            }
        }
    };

    useEffect(() => {
        loadCurrentLocationWeather(); // Load current location weather on initial render
    }, []);

    if (!forecast && !loading) {
        // If forecast is not yet loaded and not searching, show a loading indicator
        return (
            <SafeAreaView style={styles.loading}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    // Get the current weather information
    const currentWeather = forecast?.weather[0];
    const currentTemperature = forecast?.main?.temp;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={ 
                    <RefreshControl refreshing={refreshing} onRefresh={loadCurrentLocationWeather} />
                }
                style={styles.scrollView}
            >
                <Text style={styles.title}>Current Weather</Text>
                <Text style={styles.text}>
                    {currentWeather ? (currentWeather.description.charAt(0).toUpperCase() + currentWeather.description.slice(1)) : ''}
                </Text>
                <Text style={styles.text}>Temperature: {currentTemperature}°C</Text>

                {locationDetails ? (
                    <Text style={styles.text}>
                        Location: {locationDetails.city}, {locationDetails.region}
                    </Text>
                ) : (
                    <Text style={styles.text}>Location: {forecast?.name}</Text>
                )}

                <Image
                    style={styles.largeIcon}
                    source={{
                        uri: `http://openweathermap.org/img/wn/${currentWeather?.icon}@4x.png`,
                    }}
                />

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by city name"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity onPress={searchWeatherByCity} style={styles.searchButton}>
                        <Text style={styles.buttonText}>Search</Text>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator size="small" color="#C84B31" />
                        <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Weather;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
        justifyContent: 'center',
        padding: 20,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background
    },
    scrollView: {
        marginTop: 20,
    },
    title: {
        textAlign: 'center',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#C84B31',
        marginBottom: 20,
    },
    text: {
        textAlign: 'center',
        fontSize: 18,
        color: '#333',
        marginVertical: 10,
    },
    largeIcon: {
        width: 300,
        height: 250,
        alignSelf: 'center',
    },
    searchContainer: {
        marginTop: 20, // Margin from the top
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInput: {
        height: 40,
        width: '70%',
        borderColor: '#C84B31',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchButton: {
        backgroundColor: '#C84B31',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#FFFFFF', // White text for the button
        fontWeight: 'bold',
    },
    loadingIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#C84B31',
    },
});
    