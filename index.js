const fs        = require('fs');
const path      = require('path');
const basename  = path.basename(__filename);

const { buildSchema } = require('graphql')
const graphqlHTTP = require('express-graphql')
const Sequelize = require('sequelize');

const env       = process.env.NODE_ENV || 'development';
const config    = require(__dirname + '/config/config.js')[env];

const db        = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: true,
    operatorsAliases: Sequelize.Op,
    pool: {
      max: 3,
      min: 1,
      idle: 1 // Keep this very low or it'll make all Lambda requests take longer
    },
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    }
  }
);

fs
    .readdirSync(__dirname + '/models/') //HERE YO
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        var model = sequelize['import'](path.join(__dirname + '/models/', file)); // HERE YO
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const customer = sequelize.import("./models/customer.js");
const device = sequelize.import("./models/device.js");
const package = sequelize.import("./models/package.js");
const shipment = sequelize.import("./models/shipment.js");

const schema = buildSchema(`
  type Customer {
    id: ID
    customer_name: String
    customer_address: String
    customer_city: String
    customer_state: String
    customer_country: String
    customer_zipcode: String
    primary_contact_name: String
    primary_contact_phone_number: String
    primary_contact_email: String
    skycatch_sales_rep: String
  },
  type Package {
    id: ID
    package_type: String
    package_status: String
    Customer: Customer
    Shipment: Shipment
  },
  type Shipment {
    id: ID
    shipping_label: String
    tracking_number: String
    shipper: String
    Customer: Customer
  },
  type Device {
    id: ID
    serial_number: String
    resin_uuid: String
    qr_code: String
    notes: String
    mac_Address: String
    imei_number: String
    sim_serial_number: String
    device_type: String
    device_status: String
    Package: Package
  },  
  type Query {
    customer(id: ID!): Customer,
    customers(limit: Int, sort_order: String, sort_field: String): [Customer],
    package(id: ID!): Package,
    packages(limit: Int, sort_order: String, sort_field: String): [Package],
    shipment(id: ID!): Shipment,
    shipments(limit: Int, sort_order: String, sort_field: String): [Shipment],
    device(id: ID!): Device,
    devices(limit: Int, sort_order: String, sort_field: String): [Device],
  },
  type Mutation {
    createCustomer(
      customer_name: String!,
      customer_address: String!,
      customer_city: String!,
      customer_state: String!,
      customer_country: String!,
      customer_zipcode: String!,
      primary_contact_name: String!,
      primary_contact_phone_number: String!,
      primary_contact_email: String!,
      skycatch_sales_rep: String!
    ): Customer!,
    createShipment(
      shipping_label: String,
      tracking_number: String!,
      shipper: String!,
      customer_id: Int!
    ): Shipment!,
    createPackage(
      package_type: String!,
      package_status: String!,
      customer_id: Int!,
      shipment_id: Int!
    ): Package!,
    createDevice(
      serial_number: String!,
      resin_uuid: String,
      qr_code: String,
      notes: String,
      mac_address: String,
      imei_number: String
      sim_serial_number: String,
      device_type: String!,
      device_status: String!,
      package_id: Int!
    ): Device!
  }
`)

const rootValue = {
  customer: (args) => { return customer.findById(args.id) },
  customers: () => { return customer.findAll() },
  device: (args) => { return device.findById(args.id,
      {
          attributes: { exclude: ["CustomerId"] },
          include: ["Package"]
      })
  },
  devices: () => { return device.findAll(
      {
          attributes: { exclude: ["CustomerId"] },
          include: ["Package"]
      }
  )},
  package: (args) => { return package.findById(args.id, { include: ["Customer", "Shipment"]})},
  packages: () => { return package.findAll({include: ["Customer", "Shipment"]})},
  shipment: (args) => { return shipment.findById(args.id, { include: ["Customer"]})},
  shipments: () => { return shipment.findAll({include: ["Customer"]})},
  createCustomer: (args) => {
      return customer.create(
          {
              customer_name: args.customer_name,
              customer_address: args.customer_address,
              customer_city: args.customer_city,
              customer_state: args.customer_state,
              customer_country: args.customer_country,
              customer_zipcode: args.customer_zipcode,
              primary_contact_name: args.primary_contact_name,
              primary_contact_phone_number: args.primary_contact_phone_number,
              primary_contact_email: args.primary_contact_email,
              skycatch_sales_rep: args.skycatch_sales_rep
          }
      )
  },
  createShipment: (args) => {
      return shipment.create(
          {
              shipping_label: args.shipping_label,
              tracking_number: args.tracking_number,
              shipper: args.shipper,
              CustomerId: args.customer_id

          }
      )
  },
  createPackage: (args) => {
      return package.create(
          {
              package_type: args.package_type,
              package_status: args.package_status,
              CustomerId: args.customer_id,
              ShipmentId: args.shipment_id
          }
      )
  },
  createDevice: (args) => {
      return device.create(
          {
              serial_number: args.serial_number,
              resin_uuid: args.resin_uuid,
              qr_code: args.qr_code,
              notes: args.notes,
              mac_Address: args.mac_Address,
              imei_number: args.imei_number,
              sim_serial_number: args.sim_serial_number,
              device_type: args.device_type,
              device_status: args.device_status,
              PackageId: args.package_id
          }
      )
  }
};

module.exports = graphqlHTTP({
  schema,
  rootValue,
  graphiql: true
})
