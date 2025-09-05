import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, Alert, Dimensions } from 'react-native'
import { Camera } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'
import {
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Text,
  IconButton,
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from 'react-native-paper'
import { assetAPI } from '../services/api'

const { width, height } = Dimensions.get('window')

export default function ScannerScreen({ navigation }) {
  const theme = useTheme()
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off)
  const [scanning, setScanning] = useState(false)
  const [lastScannedData, setLastScannedData] = useState(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return

    setScanned(true)
    setScanning(true)
    setLastScannedData(data)

    try {
      // Process the scanned QR code
      const result = await processQRCode(data)

      if (result.success) {
        Alert.alert('Asset Found!', `Asset: ${result.asset.name}\nStatus: ${result.asset.status}`, [
          {
            text: 'View Details',
            onPress: () => navigation.navigate('Assets'),
          },
          {
            text: 'Scan Again',
            onPress: () => resetScanner(),
          },
        ])
      } else {
        Alert.alert('Asset Not Found', 'The scanned QR code does not match any known asset.', [
          {
            text: 'Try Again',
            onPress: () => resetScanner(),
          },
        ])
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      Alert.alert('Error', 'Failed to process QR code. Please try again.', [
        {
          text: 'OK',
          onPress: () => resetScanner(),
        },
      ])
    } finally {
      setScanning(false)
    }
  }

  const processQRCode = async qrData => {
    try {
      // Try to find asset by QR code
      const response = await assetAPI.getAssets({ qr_code: qrData })

      if (response.assets && response.assets.length > 0) {
        return {
          success: true,
          asset: response.assets[0],
        }
      }

      return { success: false }
    } catch (error) {
      console.error('Error processing QR code:', error)
      throw error
    }
  }

  const resetScanner = () => {
    setScanned(false)
    setLastScannedData(null)
  }

  const toggleFlash = () => {
    setFlash(
      flash === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.torch
        : Camera.Constants.FlashMode.off
    )
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.permissionCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="camera-off"
              size={64}
              color={theme.colors.error}
              style={styles.permissionIcon}
            />
            <Title style={styles.permissionTitle}>Camera Access Required</Title>
            <Paragraph style={styles.permissionText}>
              This app needs camera access to scan QR codes. Please enable camera permissions in
              your device settings.
            </Paragraph>
            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={styles.permissionButton}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        flashMode={flash}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <IconButton
              icon={flash === Camera.Constants.FlashMode.torch ? 'flash' : 'flash-off'}
              iconColor="white"
              size={24}
              onPress={toggleFlash}
            />
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>Position the QR code within the frame</Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {scanned && (
              <Button mode="contained" onPress={resetScanner} style={styles.scanAgainButton}>
                Scan Again
              </Button>
            )}
          </View>
        </View>
      </Camera>

      {/* Loading Overlay */}
      {scanning && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingOverlayText}>Processing...</Text>
        </View>
      )}

      {/* Last Scanned Data */}
      {lastScannedData && (
        <Card style={styles.lastScannedCard}>
          <Card.Content>
            <Title>Last Scanned</Title>
            <Paragraph>{lastScannedData}</Paragraph>
          </Card.Content>
        </Card>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563eb',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563eb',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563eb',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2563eb',
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#2563eb',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  permissionCard: {
    margin: 20,
    alignItems: 'center',
  },
  permissionIcon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    alignSelf: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  lastScannedCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
  },
})
