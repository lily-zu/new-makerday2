require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  switch1: Boolean,
  switch2: Boolean,
  temperature: Number,
  humidity: Number,
  switchEvents: [
    {
      switchNumber: Number,
      switchedOn: Boolean,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Device = mongoose.model('Device', deviceSchema);

app.use(cors());
app.use(express.json());

// Get all devices with switch events
app.get('/devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this route to get toggle status by device ID
app.get('/toggle-status/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findById(deviceId);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const toggleStatus = {
      switch1: device.switch1,
      switch2: device.switch2,
    };

    res.json(toggleStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get a device by ID
app.get('/devices/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findById(deviceId);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json(device);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle device switches by ID
app.post('/toggle/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { switch1, switch2 } = req.body;

  try {
    const device = await Device.findById(deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const switchEvents = [];

    if (switch1 !== undefined) {
      device.switch1 = switch1;
      switchEvents.push({ switchNumber: 1, switchedOn: switch1 });
    }

    if (switch2 !== undefined) {
      device.switch2 = switch2;
      switchEvents.push({ switchNumber: 2, switchedOn: switch2 });
    }

    device.switchEvents = [...device.switchEvents, ...switchEvents];

    await device.save();

    res.json({ message: 'Device toggled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new device
app.post('/devices', async (req, res) => {
  const { name, description } = req.body;
  try {
    const newDevice = new Device({
      name,
      description,
      switch1: false,
      switch2: false,
      switchEvents: [],
    });
    await newDevice.save();
    res.json({ message: 'Device created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update sensor data for a device
app.post('/sensor-data/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { temperature, humidity } = req.body;

  try {
    const device = await Device.findById(deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    device.temperature = temperature;
    device.humidity = humidity;

    await device.save();

    res.json({ message: 'Sensor data updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a device by ID
app.delete('/devices/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  try {
    await Device.findByIdAndRemove(deviceId);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a device by ID
app.put('/devices/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { name, description } = req.body;

  try {
    const device = await Device.findByIdAndUpdate(deviceId, { name, description }, { new: true });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ message: 'Device updated successfully', device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new switch for a device
app.post('/create-switch/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const switchEvents = [];

    if (!device.switch1) {
      device.switch1 = true;
      switchEvents.push({ switchNumber: 1, switchedOn: true });
    } else if (!device.switch2) {
      device.switch2 = true;
      switchEvents.push({ switchNumber: 2, switchedOn: true });
    } else {
      return res.status(400).json({ error: 'Both switches are already created' });
    }

    device.switchEvents = [...device.switchEvents, ...switchEvents];

    await device.save();

    res.json({ message: 'Switch created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a switch for a device
app.delete('/delete-switch/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    let switchNumber = -1;

    if (device.switch1) {
      device.switch1 = false;
      switchNumber = 1;
    } else if (device.switch2) {
      device.switch2 = false;
      switchNumber = 2;
    } else {
      return res.status(400).json({ error: 'No switches to delete' });
    }

    device.switchEvents = [
      ...device.switchEvents,
      { switchNumber, switchedOn: false },
    ];

    await device.save();

    res.json({ message: 'Switch deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
