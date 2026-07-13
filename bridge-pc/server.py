import asyncio, math, random
from asyncua import Server

async def main():
    server = Server()
    await server.init()
    server.set_endpoint("opc.tcp://0.0.0.0:4840/")
    server.set_server_name("AXIOM OPC-UA Server")

    uri = "http://axiom.opcua.server"
    idx = await server.register_namespace(uri)

    obj = await server.nodes.objects.add_object(idx, "Machine")

    temp      = await obj.add_variable(idx, "Temperature",      45.0)
    pressure  = await obj.add_variable(idx, "Pressure",          3.2)
    flow      = await obj.add_variable(idx, "FlowRate",         120.0)
    speed     = await obj.add_variable(idx, "MotorSpeed",      1500.0)
    power     = await obj.add_variable(idx, "PowerConsumption",  35.0)
    vibration = await obj.add_variable(idx, "Vibration",          4.5)
    level     = await obj.add_variable(idx, "TankLevel",         68.0)
    humidity  = await obj.add_variable(idx, "Humidity",          52.0)

    for node in [temp, pressure, flow, speed, power, vibration, level, humidity]:
        await node.set_writable()

    print("✅ OPC-UA Server started → opc.tcp://localhost:4840")
    print("\n--- Node IDs ---")
    for n, name in [(temp,"Temperature"),(pressure,"Pressure"),
                    (flow,"FlowRate"),(speed,"MotorSpeed"),
                    (power,"PowerConsumption"),(vibration,"Vibration"),
                    (level,"TankLevel"),(humidity,"Humidity")]:
        print(f"  {name}: {n.nodeid}")
    print("----------------\n")

    async with server:
        i = 0
        while True:
            t = i * 0.1
            await temp.write_value(     round(55 + 20*math.sin(t/3)   + random.uniform(-1, 1),    1))
            await pressure.write_value( round(4  + 2 *math.sin(t/5)   + random.uniform(-0.1,0.1), 2))
            await flow.write_value(     round(130 + 30*math.sin(t/4)  + random.uniform(-3, 3),    1))
            await speed.write_value(    round(1600 + 300*math.sin(t/6)+ random.uniform(-20,20),   0))
            await power.write_value(    round(38 + 15*math.sin(t/7)   + random.uniform(-1, 1),    1))
            await vibration.write_value(round(5  + 3 *math.sin(t/2)   + random.uniform(-0.3,0.3), 2))
            await level.write_value(    round(min(100,max(0, 70 + 10*math.sin(t/10)+random.uniform(-1,1))), 1))
            await humidity.write_value( round(55 + 8 *math.sin(t/8)   + random.uniform(-1, 1),    1))
            i += 1
            await asyncio.sleep(0.5)

asyncio.run(main())
